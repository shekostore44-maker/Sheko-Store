import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { requireAdmin } from "@/lib/auth/dal"
import { formatNumber, formatPrice } from "@/lib/format"
import {
  ORDER_STATUSES,
  formatDateTime,
  isOrderStatus,
  statusMeta,
} from "@/lib/orders/status"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "الطلبات" }

const PAGE_SIZE = 25

type Row = {
  id: string
  order_number: string
  customer_name: string
  phone: string
  governorate_name: string
  total: number
  status: string
  created_at: string
}

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin()
  const sp = await props.searchParams
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const status = isOrderStatus(sp.status) ? sp.status : ""
  const page = Math.max(1, Number(sp.page) || 1)

  const supabase = await createClient()
  // Commas and parentheses would break PostgREST's or() filter syntax.
  const term = q.replace(/[,()%*\\]/g, " ").trim()

  const filtered = (statusKey: string, withRows: boolean) => {
    let query = withRows
      ? supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, phone, governorate_name, total, status, created_at",
            { count: "exact" },
          )
      : supabase.from("orders").select("id", { count: "exact", head: true })
    if (term) {
      query = query.or(
        `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`,
      )
    }
    if (statusKey) query = query.eq("status", statusKey)
    return query
  }

  const from = (page - 1) * PAGE_SIZE
  const tabs = [{ key: "", label: "الكل" }, ...ORDER_STATUSES]
  const [{ data, count, error }, ...tabCounts] = await Promise.all([
    filtered(status, true)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    ...tabs.map((t) => filtered(t.key, false)),
  ])
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Row[]
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const href = (changes: Record<string, string | number>) => {
    const params = new URLSearchParams({ q, status, page: String(page) })
    for (const [k, v] of Object.entries(changes)) params.set(k, String(v))
    for (const [k, v] of [...params])
      if (!v || (k === "page" && v === "1")) params.delete(k)
    const s = params.toString()
    return `/admin/orders${s ? `?${s}` : ""}`
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
        الطلبات{" "}
        <span className="text-muted-foreground text-lg">({tabCounts[0].count ?? 0})</span>
      </h1>

      <nav aria-label="حالة الطلبات" className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <Link
            key={t.key}
            href={href({ status: t.key, page: 1 })}
            aria-current={status === t.key ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === t.key
                ? "bg-brand-navy text-brand-ice"
                : "border-border text-brand-navy border bg-white"
            }`}
          >
            {t.label} ({tabCounts[i].count ?? 0})
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap gap-2" action="/admin/orders">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث برقم الطلب أو الاسم أو الموبايل"
            className="border-input focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-white ps-9 pe-3 text-sm outline-none focus-visible:ring-3"
          />
        </div>
        <button
          type="submit"
          className="bg-brand-navy text-brand-ice h-10 rounded-lg px-5 font-semibold"
        >
          بحث
        </button>
        {q && (
          <Link
            href={href({ q: "", page: 1 })}
            className="text-muted-foreground flex h-10 items-center px-2 text-sm"
          >
            مسح البحث
          </Link>
        )}
      </form>

      <div className="border-border overflow-hidden rounded-2xl border bg-white">
        {rows.length === 0 ? (
          <div className="text-muted-foreground p-10 text-center">
            {q || status ? "مفيش طلبات بالفلاتر دي." : "لسه مفيش طلبات."}
          </div>
        ) : (
          <ul>
            <li className="bg-muted text-muted-foreground hidden grid-cols-[7rem_1fr_9rem_8rem_7rem_9rem] gap-3 px-4 py-3 text-sm font-semibold md:grid">
              <span>رقم الطلب</span>
              <span>العميل</span>
              <span>المحافظة</span>
              <span>الإجمالي</span>
              <span>الحالة</span>
              <span>التاريخ</span>
            </li>
            {rows.map((o) => {
              const meta = statusMeta(o.status)
              return (
                <li key={o.id} className="border-border border-t">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className={`hover:bg-brand-ice grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[7rem_1fr_9rem_8rem_7rem_9rem] md:items-center ${
                      o.status === "new" ? "bg-brand-blue/[0.03]" : ""
                    }`}
                  >
                    <span className="text-brand-navy font-heading font-bold" dir="ltr">
                      {o.order_number}
                    </span>
                    <span
                      className={`justify-self-end rounded-full px-2.5 py-0.5 text-xs font-semibold md:hidden ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                    <span className="min-w-0">
                      <span className="text-brand-navy block truncate font-medium">
                        {o.customer_name}
                      </span>
                      <span className="text-muted-foreground text-sm" dir="ltr">
                        {o.phone}
                      </span>
                    </span>
                    <span className="text-brand-slate hidden text-sm md:block">
                      {o.governorate_name}
                    </span>
                    <span className="text-brand-navy justify-self-end font-semibold md:justify-self-auto">
                      {formatPrice(Number(o.total))}
                    </span>
                    <span className="hidden md:block">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </span>
                    <span className="text-muted-foreground col-span-2 text-xs md:col-span-1 md:text-sm">
                      {formatDateTime(o.created_at)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="الصفحات" className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={href({ page: page - 1 })}
              className="border-border flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <ChevronRight className="size-4" aria-hidden />
              السابق
            </Link>
          )}
          <span className="text-muted-foreground text-sm">
            صفحة {formatNumber(page)} من {formatNumber(pages)}
          </span>
          {page < pages && (
            <Link
              href={href({ page: page + 1 })}
              className="border-border flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm"
            >
              التالي
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
