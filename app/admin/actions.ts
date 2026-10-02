"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type LoginState = { error?: string; email?: string } | undefined

/** Only allow redirects back into the admin area (no open redirects). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : ""
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin"
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "اكتب البريد الإلكتروني وكلمة المرور", email }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة", email }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    await supabase.auth.signOut()
    return { error: "هذا الحساب ليس له صلاحية الدخول للوحة التحكم", email }
  }

  redirect(safeNext(formData.get("next")))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}
