import { ChevronLeft, ChevronRight, ImageOff, Plus, Search, Star } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { NativeSelect } from "@/components/admin/field"
import { requireAdmin } from "@/lib/auth/dal"
import { getCategoryOptions } from "@/lib/catalog/admin-queries"
import { formatNumber } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

import { ProductRowActions } from "./product-row-actions"

export const metadata: Metadata = { title: "المنتجات" }

const PAGE_SIZE = 20
const STATUSES = [
  { key: "", label: "الكل" },
  { key: "active", label: "منشور" },
  { key: "draft", label: "مسودة" },
  { key: "out", label: "نفد المخزون" },
] as const

type Row = {
  id: string
  name: string
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  sku: string | null
  category: { name: string } | null
  product_images: { url: string }[]
}

const money = formatNumber

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin()
  const sp = await props.searchParams
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const category = typeof sp.category === "string" ? sp.category : ""
  const status = typeof sp.status === "string" ? sp.status : ""
  const page = Math.max(1, Number(sp.page) || 1)

  const supabase = await createClient()
  const categories = await getCategoryOptions()

  // A parent category also matches products in its sub-categories.
  const categoryIds = category
    ? [category, ...categories.filter((c) => c.parentId === category).map((c) => c.id)]
    : []

  // Commas and parentheses would break PostgREST's or() filter syntax.
  const term = q.replace(/[,()%*\\]/g, " ").trim()

  const filtered = (statusKey: string, withRows: boolean) => {
    let query = withRows
      ? supabase
          .from("products")
          .select(
            "id, name, price, compare_at_price, stock, is_active, is_featured, sku, category:categories(name), product_images(url)",
            { count: "exact" },
          )
      : supabase.from("products").select("id", { count: "exact", head: true })
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
    if (categoryIds.length) query = query.in("category_id", categoryIds)
    if (statusKey === "active") query = query.eq("is_active", true)
    if (statusKey === "draft") query = query.eq("is_active", false)
    if (statusKey === "out") query = query.eq("stock", 0)
    return query
  }

  const from = (page - 1) * PAGE_SIZE
  const [{ data, count, error }, ...tabCounts] = await Promise.all([
    filtered(status, true)
      .order("created_at", { ascending: false })
      .order("sort_order", { referencedTable: "product_images" })
      .limit(1, { referencedTable: "product_images" })
      .range(from, from + PAGE_SIZE - 1),
    ...STATUSES.map((s) => filtered(s.key, false)),
  ])
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const href = (changes: Record<string, string | number>) => {
    const params = new URLSearchParams({ q, category, status, page: String(page) })
    for (const [k, v] of Object.entries(changes)) params.set(k, String(v))
    for (const [k, v] of [...params])
      if (!v || (k === "page" && v === "1")) params.delete(k)
    const s = params.toString()
    return `/admin/products${s ? `?${s}` : ""}`
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
          المنتجات{" "}
          <span className="text-muted-foreground text-lg">
            ({tabCounts[0].count ?? 0})
          </span>
        </h1>
        <Link
          href="/admin/products/new"
          className="bg-brand-blue inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white"
        >
          <Plus className="size-4" aria-hidden />
          منتج جديد
        </Link>
      </div>

      <nav aria-label="حالة المنتجات" className="flex flex-wrap gap-2">
        {STATUSES.map((s, i) => (
          <Link
            key={s.key}
            href={href({ status: s.key, page: 1 })}
            aria-current={status === s.key ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === s.key
                ? "bg-brand-navy text-brand-ice"
                : "border-border text-brand-navy border bg-white"
            }`}
          >
            {s.label} ({tabCounts[i].count ?? 0})
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap gap-2" action="/admin/products">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="border-input relative min-w-56 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو الكود (SKU)"
            className="border-input focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-white ps-9 pe-3 text-sm outline-none focus-visible:ring-3"
          />
        </div>
        <NativeSelect
          name="category"
          defaultValue={category}
          className="w-auto min-w-44 bg-white"
        >
          <option value="">كل الأقسام</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
        <button
          type="submit"
          className="bg-brand-navy text-brand-ice h-10 rounded-lg px-5 font-semibold"
        >
          تطبيق
        </button>
        {(q || category) && (
          <Link
            href={href({ q: "", category: "", page: 1 })}
            className="text-muted-foreground flex h-10 items-center px-2 text-sm"
          >
            مسح الفلاتر
          </Link>
        )}
      </form>

      <div className="border-border overflow-hidden rounded-2xl border bg-white">
        {rows.length === 0 ? (
          <div className="text-muted-foreground p-10 text-center">
            {q || category || status
              ? "مفيش منتجات بالفلاتر دي."
              : "لسه مفيش منتجات. اضغط «منتج جديد» عشان تضيف أول منتج."}
          </div>
        ) : (
          <ul>
            <li className="bg-muted text-muted-foreground hidden grid-cols-[1fr_9rem_7rem_7rem_5rem_9rem] gap-3 px-4 py-3 text-sm font-semibold md:grid">
              <span>المنتج</span>
              <span>القسم</span>
              <span>السعر</span>
              <span>المخزون</span>
              <span className="text-center">منشور</span>
              <span className="text-center">إجراءات</span>
            </li>
            {rows.map((p) => (
              <li
                key={p.id}
                className="border-border grid grid-cols-[1fr_auto] items-center gap-3 border-t px-4 py-3 md:grid-cols-[1fr_9rem_7rem_7rem_5rem_9rem]"
              >
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#eef2f9]">
                    {p.product_images[0] ? (
                      <Image
                        src={p.product_images[0].url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <ImageOff className="text-muted-foreground absolute inset-0 m-auto size-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-brand-navy truncate font-semibold">
                      {p.is_featured && (
                        <Star
                          className="fill-warning text-warning me-1 inline size-4"
                          aria-label="مميز"
                        />
                      )}
                      {p.name}
                    </p>
                    <p className="text-muted-foreground text-xs md:hidden">
                      {money(p.price)} ج.م · {p.stock === 0 ? "نفد" : `${p.stock} قطعة`}
                    </p>
                    {p.sku && (
                      <p
                        dir="ltr"
                        className="text-muted-foreground hidden text-end text-xs md:block"
                      >
                        {p.sku}
                      </p>
                    )}
                  </div>
                </Link>
                <p className="text-brand-navy-soft hidden truncate text-sm md:block">
                  {p.category?.name}
                </p>
                <p className="hidden text-sm md:block">
                  <span className="text-brand-navy font-semibold">{money(p.price)}</span>
                  {p.compare_at_price && (
                    <span className="text-muted-foreground ms-1 text-xs line-through">
                      {money(p.compare_at_price)}
                    </span>
                  )}
                </p>
                <p
                  className={`hidden text-sm font-semibold md:block ${
                    p.stock === 0
                      ? "text-destructive"
                      : p.stock <= 5
                        ? "text-[#8a5300]"
                        : "text-success"
                  }`}
                >
                  {p.stock === 0
                    ? "نفد"
                    : p.stock <= 5
                      ? `${p.stock} · قليل`
                      : `${p.stock} قطعة`}
                </p>
                <ProductRowActions id={p.id} name={p.name} isActive={p.is_active} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <nav
          aria-label="الصفحات"
          className="flex items-center justify-center gap-3 text-sm"
        >
          {page > 1 ? (
            <Link
              href={href({ page: page - 1 })}
              className="border-border inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2"
            >
              <ChevronRight className="size-4" aria-hidden /> السابق
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            صفحة {page} من {pages}
          </span>
          {page < pages ? (
            <Link
              href={href({ page: page + 1 })}
              className="border-border inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2"
            >
              التالي <ChevronLeft className="size-4" aria-hidden />
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  )
}
