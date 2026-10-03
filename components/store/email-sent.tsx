"use client"

import { MailCheck } from "lucide-react"
import { useState, useTransition } from "react"

/** "Check your inbox" panel, with an optional resend button. */
export function EmailSent({
  email,
  title,
  children,
  onResend,
}: {
  email: string
  title: string
  children: React.ReactNode
  onResend?: () => Promise<{ ok: boolean; error?: string }>
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  return (
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      <span className="bg-success-soft text-success grid size-14 place-items-center rounded-full">
        <MailCheck className="size-7" aria-hidden />
      </span>
      <p className="text-brand-navy text-lg font-bold">{title}</p>
      <p className="text-brand-slate text-sm">
        بعتنا رسالة على{" "}
        <span dir="ltr" className="text-brand-navy font-semibold">
          {email}
        </span>
      </p>
      <p className="text-brand-slate text-sm">{children}</p>
      <p className="text-muted-foreground text-xs">
        مش لاقيها؟ بص في Spam أو الرسائل غير المرغوب فيها.
      </p>
      {onResend && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await onResend()
              setMessage(result.ok ? "اتبعتت تاني ✓" : (result.error ?? "حصلت مشكلة"))
            })
          }
          className="text-brand-blue text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "جاري الإرسال…" : "ابعت الرسالة تاني"}
        </button>
      )}
      {message && <p className="text-brand-navy text-sm">{message}</p>}
    </div>
  )
}
