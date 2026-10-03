"use client"

import { useActionState } from "react"

import { AuthField, FormAlert, SubmitButton } from "@/components/store/auth-ui"

import { updatePassword, type AuthState } from "../actions"

/** New password + confirmation; used after a reset link and in the account. */
export function PasswordForm({ submitLabel }: { submitLabel: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    undefined,
  )
  const e = state?.fieldErrors ?? {}

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <AuthField
        id="password"
        label="كلمة المرور الجديدة"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        minLength={8}
        error={e.password}
        hint="8 حروف على الأقل"
      />
      <AuthField
        id="confirm"
        label="تأكيد كلمة المرور"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        error={e.confirm}
      />
      <FormAlert>{state?.error}</FormAlert>
      <SubmitButton pending={pending}>
        {pending ? "جاري الحفظ…" : submitLabel}
      </SubmitButton>
    </form>
  )
}
