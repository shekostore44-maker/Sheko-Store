import { Stars } from "@/components/store/stars"
import type { StoreReview } from "@/lib/catalog/store-queries"
import { countLabel, formatNumber } from "@/lib/format"

import { ReviewForm } from "./review-form"

const dateFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  dateStyle: "medium",
  timeZone: "Africa/Cairo",
})

export const reviewCount = (n: number) =>
  countLabel(n, { one: "تقييم واحد", two: "تقييمين", few: "تقييمات", many: "تقييم" })

export function ReviewsSection({
  productId,
  slug,
  reviews,
  average,
  count,
  distribution,
}: {
  productId: string
  slug: string
  reviews: StoreReview[]
  average: number
  count: number
  distribution: number[]
}) {
  const bars = [5, 4, 3, 2, 1].map((stars, i) => ({ stars, n: distribution[i] ?? 0 }))

  return (
    <section
      id="reviews"
      className="border-border mt-12 scroll-mt-24 rounded-3xl border bg-white p-6 sm:p-8"
    >
      <h2 className="text-brand-navy mb-6 text-2xl font-bold">تقييمات العملاء</h2>
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-4">
          {count > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-heading text-brand-navy text-4xl font-bold">
                  {formatNumber(average)}
                </span>
                <div>
                  <Stars value={average} className="size-5" />
                  <p className="text-muted-foreground text-sm">{reviewCount(count)}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {bars.map((b) => (
                  <li key={b.stars} className="flex items-center gap-2">
                    <span className="text-brand-slate w-4">{b.stars}</span>
                    <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <span
                        className="block h-full rounded-full bg-[#f5a524]"
                        style={{ width: `${count ? (b.n / count) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="text-muted-foreground w-6 text-end">{b.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-brand-slate">لسه مفيش تقييمات للمنتج ده.</p>
          )}
          <ReviewForm productId={productId} slug={slug} />
        </div>

        {reviews.length > 0 && (
          <ul className="divide-border flex flex-col divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-1.5 py-4 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-brand-navy text-sm font-semibold">
                    {r.author_name || "عميل Sheko"}
                  </span>
                  <span className="bg-success-soft text-success rounded-full px-2 py-0.5 text-[0.7rem] font-semibold">
                    مشتري مؤكد
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {dateFormat.format(new Date(r.created_at))}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-brand-slate leading-relaxed">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
