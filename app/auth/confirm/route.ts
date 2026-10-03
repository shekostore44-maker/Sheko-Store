import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]

/** Same-site paths outside the admin area only. */
function safeNext(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/admin")
    ? value
    : "/account"
}

/**
 * Landing page for links in auth emails (sign-up confirmation, password reset)
 * and for Google sign-in. Signs the visitor in, then sends them on.
 * - ?token_hash=…&type=… : email links (works on any device)
 * - ?code=…              : OAuth / PKCE links (same browser only)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))
  const supabase = await createClient()

  let ok = false
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  }

  if (!ok) {
    const failed = new URL("/login", request.url)
    failed.searchParams.set("error", "link")
    return NextResponse.redirect(failed)
  }

  // A reset link always continues to the new-password form.
  const destination = type === "recovery" ? "/reset-password" : next
  const url = new URL(destination, request.url)
  if (type === "signup" || type === "email") url.searchParams.set("welcome", "1")
  return NextResponse.redirect(url)
}
