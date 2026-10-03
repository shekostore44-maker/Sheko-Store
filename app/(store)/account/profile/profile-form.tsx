"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { AuthField, SubmitButton } from "@/components/store/auth-ui"

import { saveProfile } from "../actions"

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [form, setForm] = useState({ full_name: fullName, phone })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveProfile(form)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        return void toast.error(result.error)
      }
      setErrors({})
      toast.success("اتحفظت بياناتك")
    })
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <AuthField
        id="full_name"
        label="الاسم بالكامل"
        autoComplete="name"
        value={form.full_name}
        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        error={errors.full_name}
      />
      <AuthField
        id="phone"
        label="رقم الموبايل"
        type="tel"
        dir="ltr"
        autoComplete="tel"
        placeholder="01xxxxxxxxx"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        error={errors.phone}
        className="text-end"
      />
      <div className="sm:col-span-2">
        <SubmitButton pending={pending}>
          {pending ? "جاري الحفظ…" : "حفظ البيانات"}
        </SubmitButton>
      </div>
    </form>
  )
}
