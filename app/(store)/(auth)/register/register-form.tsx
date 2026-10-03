"use client"

import { useActionState } from "react"

import { AuthField, FormAlert, SubmitButton } from "@/components/store/auth-ui"
import { EmailSent } from "@/components/store/email-sent"

import { resendConfirmation, signUpCustomer, type AuthState } from "../actions"

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUpCustomer,
    undefined,
  )

  if (state?.sentTo) {
    const email = state.sentTo
    return (
      <EmailSent
        email={email}
        title="خطوة أخيرة: أكّد بريدك"
        onResend={() => resendConfirmation(email)}
      >
        افتح الرسالة واضغط على لينك التأكيد عشان حسابك يتفعّل.
      </EmailSent>
    )
  }

  const v = state?.values ?? {}
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="name"
        label="الاسم بالكامل"
        autoComplete="name"
        required
        key={`name-${v.name ?? ""}`}
        defaultValue={v.name}
        error={e.name}
      />
      <AuthField
        id="email"
        label="البريد الإلكتروني"
        type="email"
        dir="ltr"
        autoComplete="email"
        required
        key={`email-${v.email ?? ""}`}
        defaultValue={v.email}
        error={e.email}
        className="text-start"
      />
      <AuthField
        id="phone"
        label="رقم الموبايل (اختياري)"
        type="tel"
        dir="ltr"
        autoComplete="tel"
        placeholder="01xxxxxxxxx"
        key={`phone-${v.phone ?? ""}`}
        defaultValue={v.phone}
        error={e.phone}
        hint="بنملا بيه بياناتك في الطلب الجاي"
        className="text-end"
      />
      <AuthField
        id="password"
        label="كلمة المرور"
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
        {pending ? "جاري إنشاء الحساب…" : "إنشاء الحساب"}
      </SubmitButton>
    </form>
  )
}
