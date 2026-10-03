"use client"

import Link from "next/link"
import { useActionState } from "react"

import { AuthField, FormAlert, SubmitButton } from "@/components/store/auth-ui"

import { signInCustomer, type AuthState } from "../actions"

export function LoginForm({
  next,
  initialError,
}: {
  next: string
  initialError?: string
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signInCustomer,
    initialError ? { error: initialError } : undefined,
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="email"
        label="البريد الإلكتروني"
        type="email"
        dir="ltr"
        autoComplete="email"
        required
        key={state?.values?.email ?? ""}
        defaultValue={state?.values?.email}
        className="text-start"
      />
      <div className="flex flex-col gap-1.5">
        <AuthField
          id="password"
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
        />
        <Link
          href="/forgot-password"
          className="text-brand-blue self-end text-sm font-medium"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>
      <FormAlert>{state?.error}</FormAlert>
      <SubmitButton pending={pending}>{pending ? "جاري الدخول…" : "دخول"}</SubmitButton>
    </form>
  )
}
