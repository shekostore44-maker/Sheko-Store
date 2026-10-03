import type { Metadata } from "next"
import Link from "next/link"

import { Stars } from "@/components/store/stars"
import { requireAdmin } from "@/lib/auth/dal"
import { formatDateTime } from "@/lib/orders/status"
import { createClient } from "@/lib/supabase/server"

import { ReviewActions } from "./review-actions"

export const metadata: Metadata = { title: "التقييمات" }

type Row = {
  id: string
  rating: number
  comment: string | null
  author_name: string | null
  is_approved: boolean
  created_at: string
  product: { name: string; slug: string } | null
}

const TABS = [
  { key: "pending", label: "مستنية المراجعة" },
  { key: "approved", label: "منشورة" },
] as const

export default async function ReviewsPage(props: PageProps<"/admin/reviews">) {
  await requireAdmin()
  const sp = await props.searchParams
  const tab = sp.tab === "approved" ? "approved" : "pending"

  const supabase = await createClient()
  const count = (approved: boolean) =>
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", approved)
  const [{ data, error }, pending, approved] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, rating, comment, author_name, is_approved, created_at, product:products(name, slug)",
      )
      .eq("is_approved", tab === "approved")
      .order("created_at", { ascending: false })
      .limit(100),
    count(false),
    count(true),
  ])
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as Row[]
  const counts = { pending: pending.count ?? 0, approved: approved.count ?? 0 }

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">التقييمات</h1>
        <p className="text-muted-foreground mt-1">
          التقييمات بتيجي بس من عملاء استلموا المنتج، ومش بتظهر في المتجر غير لما توافق
          عليها.
        </p>
      </div>

      <nav aria-label="حالة التقييمات" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "pending" ? "/admin/reviews" : "/admin/reviews?tab=approved"}
            aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-brand-navy text-brand-ice"
                : "border-border text-brand-navy border bg-white"
            }`}
          >
            {t.label} ({counts[t.key]})
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-2xl border bg-white p-10 text-center">
          {tab === "pending" ? "مفيش تقييمات مستنية مراجعة." : "مفيش تقييمات منشورة لسه."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="border-border flex flex-col gap-2 rounded-2xl border bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-brand-navy font-semibold">
                  {r.author_name || "عميل"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(r.created_at)}
                </span>
              </div>
              {r.product && (
                <a
                  href={`/p/${r.product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue text-sm font-medium"
                >
                  {r.product.name}
                </a>
              )}
              {r.comment ? (
                <p className="text-brand-slate whitespace-pre-wrap">{r.comment}</p>
              ) : (
                <p className="text-muted-foreground text-sm">(من غير تعليق)</p>
              )}
              <ReviewActions id={r.id} approved={r.is_approved} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
