"use client"

import { useActionState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { signIn, type LoginState } from "../actions"

export function LoginForm({
  next,
  initialError,
}: {
  next?: string
  initialError?: string
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    signIn,
    initialError ? { error: initialError } : undefined,
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          // Remount with the submitted email after a failed attempt so the
          // uncontrolled input keeps what was typed.
          key={state?.email ?? ""}
          defaultValue={state?.email}
          className="h-11 text-start"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className="h-11 text-start"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-navy text-brand-ice hover:bg-brand-navy-soft h-11 rounded-xl font-bold transition disabled:opacity-60"
      >
        {pending ? "جاري الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  )
}
