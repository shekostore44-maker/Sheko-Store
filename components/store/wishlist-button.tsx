"use client"

import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { getWishlistState, setWishlist } from "@/app/(store)/account/actions"

/** Heart toggle; product pages are cached, so the state loads after render. */
export function WishlistButton({ productId, slug }: { productId: string; slug: string }) {
  const [saved, setSaved] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    getWishlistState(productId)
      .then((state) => {
        if (!cancelled) setSaved(state ?? false)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [productId])

  function toggle() {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const result = await setWishlist(productId, next)
      if (result.ok) {
        toast.success(next ? "اتحفظ في المفضلة" : "اتشال من المفضلة")
        return
      }
      setSaved(!next)
      if ("signIn" in result) {
        router.push(`/login?next=${encodeURIComponent(`/p/${slug}`)}`)
      } else toast.error(result.error)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || saved === null}
      aria-pressed={!!saved}
      aria-label={saved ? "شيل من المفضلة" : "احفظ في المفضلة"}
      className={`grid size-12 shrink-0 place-items-center rounded-xl border transition disabled:opacity-60 ${
        saved
          ? "border-[#e11d48]/30 bg-[#fff1f2] text-[#e11d48]"
          : "border-border text-brand-navy bg-white hover:border-[#e11d48]/40"
      }`}
    >
      <Heart className={`size-5 ${saved ? "fill-current" : ""}`} />
    </button>
  )
}
