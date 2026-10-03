"use client"

import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ORDER_STATUSES } from "@/lib/orders/status"

import { setOrderStatus } from "../actions"

export function StatusChanger({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status)
  const [pending, startTransition] = useTransition()
  const [target, setTarget] = useState<string | null>(null)
  const router = useRouter()

  function change(next: string) {
    if (next === current) return
    if (next === "cancelled" && !confirm("إلغاء الطلب؟ المنتجات هترجع للمخزون.")) return
    if (
      current === "cancelled" &&
      !confirm("ترجيع الطلب؟ المنتجات هتتخصم من المخزون تاني.")
    ) {
      return
    }
    setTarget(next)
    startTransition(async () => {
      const result = await setOrderStatus(id, next)
      setTarget(null)
      if (!result.ok) return void toast.error(result.error)
      setCurrent(next)
      toast.success("اتحدثت حالة الطلب")
      router.refresh()
    })
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {ORDER_STATUSES.map((s) => {
        const active = s.key === current
        return (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => change(s.key)}
              disabled={pending}
              aria-pressed={active}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm font-medium transition disabled:cursor-wait ${
                active
                  ? `${s.className} border-transparent font-bold`
                  : "border-border text-brand-navy hover:bg-brand-ice bg-white"
              }`}
            >
              {target === s.key ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : active ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <span className="size-4" />
              )}
              {s.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
