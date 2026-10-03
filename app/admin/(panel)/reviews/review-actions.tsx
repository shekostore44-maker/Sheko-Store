"use client"

import { Check, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/admin/confirm-delete"

import { deleteReview, setReviewApproved } from "./actions"

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    startTransition(async () => {
      const result = await setReviewApproved(id, !approved)
      if (!result.ok) return void toast.error(result.error)
      toast.success(approved ? "التقييم اتخفى من المتجر" : "التقييم اتنشر")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
          approved
            ? "border-border text-brand-navy border bg-white"
            : "bg-success text-white"
        }`}
      >
        {approved ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        {approved ? "إخفاء" : "موافقة ونشر"}
      </button>
      <ConfirmDelete
        title="حذف التقييم؟"
        description="التقييم هيتمسح نهائياً."
        onConfirm={async () => {
          const result = await deleteReview(id)
          if (!result.ok) {
            toast.error(result.error)
            return false
          }
          toast.success("اتمسح التقييم")
          router.refresh()
          return true
        }}
      />
    </div>
  )
}
