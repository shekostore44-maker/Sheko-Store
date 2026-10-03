"use client"

import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

/** Google sign-in shows only after it is set up in Supabase and Vercel. */
export const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-14">
      <div className="border-border flex flex-col gap-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/brand/sheko-icon-512.png" alt="" width={56} height={56} />
          <h1 className="text-brand-navy text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-brand-slate text-sm">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

export function AuthField({
  id,
  label,
  error,
  hint,
  className = "",
  ...input
}: React.ComponentProps<"input"> & {
  id: string
  label: string
  error?: string
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-brand-navy text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`border-border focus-visible:border-brand-blue focus-visible:ring-ring/30 aria-invalid:border-destructive h-12 w-full rounded-xl border bg-white px-4 text-base outline-none focus-visible:ring-4 ${className}`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  )
}

export function FormAlert({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm"
    >
      {children}
    </p>
  )
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand-navy text-brand-ice flex h-12 items-center justify-center gap-2 rounded-xl px-8 font-bold disabled:opacity-70"
    >
      {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export function GoogleButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  if (!googleEnabled) return null

  async function signIn() {
    setPending(true)
    setError("")
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) {
      setPending(false)
      setError("الدخول بجوجل مش متاح دلوقتي")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="border-border text-brand-navy hover:bg-brand-ice flex h-12 items-center justify-center gap-3 rounded-xl border bg-white font-semibold disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <GoogleLogo />
        )}
        المتابعة بحساب Google
      </button>
      <FormAlert>{error}</FormAlert>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        أو بالبريد الإلكتروني
        <span className="bg-border h-px flex-1" />
      </div>
    </div>
  )
}
