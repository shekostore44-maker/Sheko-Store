"use client"

import { useActionState } from "react"

import { AuthField, FormAlert, SubmitButton } from "@/components/store/auth-ui"
import { EmailSent } from "@/components/store/email-sent"

import { requestPasswordReset, type AuthState } from "../actions"

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    undefined,
  )

  if (state?.sentTo) {
    return (
      <EmailSent email={state.sentTo} title="افتح بريدك">
        لو البريد ده متسجل عندنا، هتلاقي رسالة فيها لينك لعمل كلمة مرور جديدة.
      </EmailSent>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
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
      <FormAlert>{state?.error}</FormAlert>
      <SubmitButton pending={pending}>
        {pending ? "جاري الإرسال…" : "ابعت اللينك"}
      </SubmitButton>
    </form>
  )
}
