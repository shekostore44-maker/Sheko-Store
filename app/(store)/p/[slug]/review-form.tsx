"use client"

import { Loader2, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  getReviewEligibility,
  submitReview,
  type ReviewEligibility,
} from "./review-actions"

const LABELS = ["", "وحش", "مقبول", "كويس", "كويس جداً", "ممتاز"]

/** Product pages are cached for everyone, so eligibility loads after render. */
export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, setState] = useState<ReviewEligibility | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getReviewEligibility(productId)
      .then((s) => {
        if (!cancelled) setState(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [productId])

  if (!state) return null

  const box = "bg-brand-ice text-brand-navy rounded-2xl p-4 text-sm"
  if (state.status === "signed-out") {
    return (
      <p className={box}>
        اشتريت المنتج ده؟{" "}
        <Link
          href={`/login?next=${encodeURIComponent(`/p/${slug}#reviews`)}`}
          className="text-brand-blue font-semibold"
        >
          سجّل دخول
        </Link>{" "}
        وقيّمه.
      </p>
    )
  }
  if (state.status === "not-eligible") {
    return <p className={box}>التقييم متاح بعد ما طلب فيه المنتج ده يوصلك.</p>
  }
  if (state.status === "reviewed") {
    return (
      <p className={box}>
        {state.approved
          ? "شكراً! تقييمك منشور."
          : "شكراً على تقييمك! هيظهر هنا بعد المراجعة."}
      </p>
    )
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!rating) return void toast.error("اختار عدد النجوم")
    startTransition(async () => {
      const result = await submitReview({ productId, rating, comment })
      if (!result.ok) return void toast.error(result.error)
      toast.success("شكراً! تقييمك هيظهر بعد المراجعة")
      setState({ status: "reviewed", approved: false, rating })
    })
  }

  const shown = hover || rating
  return (
    <form
      onSubmit={submit}
      className="border-border flex flex-col gap-3 rounded-2xl border p-4"
    >
      <p className="text-brand-navy font-semibold">قيّم المنتج</p>
      <div className="flex items-center gap-2">
        <div
          className="flex"
          role="radiogroup"
          aria-label="عدد النجوم"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} من 5`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5"
            >
              <Star
                className={`size-7 transition ${n <= shown ? "fill-[#f5a524] text-[#f5a524]" : "text-border"}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <span className="text-brand-slate text-sm">{LABELS[shown]}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="اكتب رأيك (اختياري)"
        aria-label="رأيك في المنتج"
        className="border-border focus-visible:border-brand-blue focus-visible:ring-ring/30 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-4"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-navy text-brand-ice flex h-11 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        إرسال التقييم
      </button>
    </form>
  )
}
