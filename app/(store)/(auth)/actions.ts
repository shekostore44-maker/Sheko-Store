"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { normalizePhone } from "@/lib/cart/schemas"
import { siteConfig } from "@/lib/site"
import { createClient } from "@/lib/supabase/server"

export type AuthState =
  | {
      error?: string
      fieldErrors?: Record<string, string>
      /** Kept so the form can refill after a failed attempt. */
      values?: Record<string, string>
      /** A confirmation or reset email was sent to this address. */
      sentTo?: string
    }
  | undefined

/** Only same-site paths outside the admin area (no open redirects). */
export async function safeCustomerNext(value: unknown) {
  const next = typeof value === "string" ? value : ""
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin")
    ? next
    : "/account"
}

const confirmUrl = (next: string) =>
  `${siteConfig.url}/auth/confirm?next=${encodeURIComponent(next)}`

/** Arabic text for Supabase Auth errors. */
function authError(error: { code?: string; message: string }) {
  switch (error.code) {
    case "invalid_credentials":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة"
    case "email_not_confirmed":
      return "لازم تأكد بريدك الإلكتروني الأول. افتح الرسالة اللي بعتناهالك واضغط على اللينك."
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "محاولات كتير في وقت قصير. استنى شوية وجرّب تاني."
    case "weak_password":
      return "كلمة المرور ضعيفة. استخدم 8 حروف على الأقل وخليها صعبة التخمين."
    case "same_password":
      return "كلمة المرور الجديدة لازم تبقى مختلفة عن القديمة"
    case "signup_disabled":
      return "التسجيل مقفول حالياً"
    default:
      return "حصلت مشكلة، جرّب تاني بعد شوية"
  }
}

export async function signInCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) {
    return { error: "اكتب البريد الإلكتروني وكلمة المرور", values: { email } }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: authError(error), values: { email } }

  redirect(await safeCustomerNext(formData.get("next")))
}

const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { error: "اكتب اسمك (3 حروف على الأقل)" })
      .max(80, { error: "الاسم طويل جداً" }),
    email: z.email({ error: "البريد الإلكتروني مش صحيح" }),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(
        z.string().regex(/^(01[0125]\d{8})?$/, {
          error: "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015",
        }),
      ),
    password: z
      .string()
      .min(8, { error: "كلمة المرور لازم تبقى 8 حروف على الأقل" })
      .max(72, { error: "كلمة المرور طويلة جداً" }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    error: "كلمتين المرور مش زي بعض",
    path: ["confirm"],
  })

export async function signUpCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  }
  const values = { name: raw.name, email: raw.email, phone: raw.phone }
  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message
    return { error: "راجع البيانات المكتوبة باللون الأحمر", fieldErrors, values }
  }

  const next = await safeCustomerNext(formData.get("next"))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: confirmUrl(next),
      data: { full_name: parsed.data.name, phone: parsed.data.phone || null },
    },
  })
  if (error) return { error: authError(error), values }

  // Email confirmation off: already signed in.
  if (data.session) redirect(next)
  // Same message whether or not the email already had an account,
  // so the form can't be used to discover who is registered.
  return { sentTo: parsed.data.email }
}

export async function resendConfirmation(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!z.email().safeParse(email).success) return { ok: false, error: "بريد غير صحيح" }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmUrl("/account") },
  })
  return error ? { ok: false, error: authError(error) } : { ok: true }
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!z.email().safeParse(email).success) {
    return { error: "اكتب بريدك الإلكتروني صح", values: { email } }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl("/reset-password"),
  })
  // Don't reveal whether the email has an account; only report rate limits.
  if (error && error.code?.startsWith("over_")) {
    return { error: authError(error), values: { email } }
  }
  return { sentTo: email }
}

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "كلمة المرور لازم تبقى 8 حروف على الأقل" })
      .max(72, { error: "كلمة المرور طويلة جداً" }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    error: "كلمتين المرور مش زي بعض",
    path: ["confirm"],
  })

/** Sets a new password for the signed-in user (after a reset link or from the account). */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message
    return { error: "راجع كلمة المرور", fieldErrors }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) {
    return {
      error: "اللينك انتهى أو اتستخدم قبل كده. اطلب لينك جديد من «نسيت كلمة المرور».",
    }
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: authError(error) }

  redirect("/account?password=updated")
}

export async function signOutCustomer() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
