import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumbs, type Crumb } from "@/components/store/breadcrumbs"
import { ProductGrid } from "@/components/store/product-card"
import {
  CATEGORY_PAGE_SIZE,
  getCategoryBySlug,
  getCategoryProducts,
  type CategoryFilters,
} from "@/lib/catalog/store-queries"
import { decodeParam, productCount } from "@/lib/format"

const SORTS = [
  { value: "new", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل" },
  { value: "price_desc", label: "السعر: من الأعلى" },
] as const

function readFilters(sp: Record<string, string | string[] | undefined>): CategoryFilters {
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined)
  const num = (k: string) => {
    const n = Number(str(k))
    return str(k) && Number.isFinite(n) && n >= 0 ? n : undefined
  }
  const sort = str("sort")
  return {
    sub: str("sub"),
    min: num("min"),
    max: num("max"),
    inStock: str("in_stock") === "1",
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "new",
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  }
}

export async function generateMetadata(props: PageProps<"/c/[slug]">): Promise<Metadata> {
  const slug = decodeParam((await props.params).slug)
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  const description =
    category.seo_description ||
    category.description ||
    `تسوّق ${category.name} من Sheko. شحن لكل المحافظات والدفع عند الاستلام.`
  return {
    title: category.seo_title || category.name,
    description,
    alternates: { canonical: `/c/${category.slug}` },
    openGraph: {
      title: category.seo_title || category.name,
      description,
      images: category.image_url ? [category.image_url] : undefined,
    },
  }
}

export default async function CategoryPage(props: PageProps<"/c/[slug]">) {
  const slug = decodeParam((await props.params).slug)
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const filters = readFilters(await props.searchParams)
  const { products, total } = await getCategoryProducts(category, filters)
  const pages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE))
  const filtered = Boolean(
    filters.min !== undefined || filters.max !== undefined || filters.inStock,
  )

  const base = `/c/${category.slug}`
  const href = (changes: Partial<Record<string, string | number | undefined>>) => {
    const params = new URLSearchParams()
    const merged = {
      sub: filters.sub,
      min: filters.min,
      max: filters.max,
      in_stock: filters.inStock ? 1 : undefined,
      sort: filters.sort === "new" ? undefined : filters.sort,
      page: filters.page,
      ...changes,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && Number(v) === 1))
        params.set(k, String(v))
    }
    const s = params.toString()
    return s ? `${base}?${s}` : base
  }

  const crumbs: Crumb[] = [{ label: "الرئيسية", href: "/" }]
  if (category.parent)
    crumbs.push({ label: category.parent.name, href: `/c/${category.parent.slug}` })
  crumbs.push({ label: category.name })

  const filterForm = (
    <form action={base} className="mt-4 flex flex-col gap-4">
      {filters.sub && <input type="hidden" name="sub" value={filters.sub} />}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-brand-navy font-semibold">الترتيب</span>
        <select
          name="sort"
          defaultValue={filters.sort}
          className="border-input h-10 rounded-lg border bg-white px-2"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1.5 text-sm">
        <legend className="text-brand-navy mb-1.5 font-semibold">السعر (ج.م)</legend>
        <div className="flex items-center gap-2">
          <input
            name="min"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="من"
            defaultValue={filters.min}
            aria-label="أقل سعر"
            className="border-input h-10 w-full rounded-lg border px-2"
          />
          <span aria-hidden>–</span>
          <input
            name="max"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="إلى"
            defaultValue={filters.max}
            aria-label="أعلى سعر"
            className="border-input h-10 w-full rounded-lg border px-2"
          />
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="in_stock"
          value="1"
          defaultChecked={filters.inStock}
          className="accent-brand-blue size-4"
        />
        <span className="text-brand-navy">المتوفر فقط</span>
      </label>
      <button
        type="submit"
        className="bg-brand-navy text-brand-ice h-10 rounded-xl font-semibold"
      >
        تطبيق
      </button>
      {(filtered || filters.sort !== "new") && (
        <Link
          href={href({
            min: undefined,
            max: undefined,
            in_stock: undefined,
            sort: undefined,
            page: 1,
          })}
          className="text-muted-foreground text-center text-sm"
        >
          مسح الفلاتر
        </Link>
      )}
    </form>
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={crumbs} />

      <header className="from-brand-navy to-brand-blue relative mt-4 flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-l p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold sm:text-4xl">{category.name}</h1>
          {category.description && (
            <p className="mt-2 leading-relaxed text-[#dce6f8]">{category.description}</p>
          )}
          <p className="mt-3 text-sm text-[#b9c6e4]">{productCount(total)}</p>
        </div>
        {category.image_url && (
          <div className="relative hidden size-32 shrink-0 sm:block">
            <Image
              src={category.image_url}
              alt=""
              fill
              sizes="128px"
              className="object-contain"
              priority
            />
          </div>
        )}
      </header>

      {category.children.length > 0 && (
        <nav aria-label="الأقسام الفرعية" className="mt-5 flex flex-wrap gap-2">
          <Link
            href={href({ sub: undefined, page: 1 })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${!filters.sub ? "bg-brand-navy text-brand-ice" : "border-border text-brand-navy border bg-white"}`}
          >
            الكل
          </Link>
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={href({ sub: child.slug, page: 1 })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${filters.sub === child.slug ? "bg-brand-navy text-brand-ice" : "border-border text-brand-navy border bg-white"}`}
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[16rem_1fr]">
        <div>
          {/* Mobile: collapsible. Desktop: always-visible sidebar. */}
          <details
            className="border-border rounded-2xl border bg-white p-4 lg:hidden"
            open={filtered}
          >
            <summary className="text-brand-navy flex cursor-pointer items-center gap-2 font-bold">
              <SlidersHorizontal className="size-4" aria-hidden />
              تصفية وترتيب
            </summary>
            {filterForm}
          </details>
          <div className="border-border sticky top-28 hidden rounded-2xl border bg-white p-4 lg:block">
            <p className="text-brand-navy flex items-center gap-2 font-bold">
              <SlidersHorizontal className="size-4" aria-hidden />
              تصفية وترتيب
            </p>
            {filterForm}
          </div>
        </div>

        <div>
          {products.length > 0 ? (
            <ProductGrid products={products} priorityCount={4} />
          ) : (
            <div className="border-border text-muted-foreground rounded-2xl border border-dashed bg-white p-12 text-center">
              {filtered
                ? "مفيش منتجات بالفلاتر دي. جرّب تغيّر السعر أو امسح الفلاتر."
                : "لسه مفيش منتجات في القسم ده."}
            </div>
          )}

          {pages > 1 && (
            <nav
              aria-label="الصفحات"
              className="mt-10 flex items-center justify-center gap-3 text-sm"
            >
              {filters.page! > 1 && (
                <Link
                  href={href({ page: filters.page! - 1 })}
                  rel="prev"
                  className="border-border inline-flex items-center gap-1 rounded-xl border bg-white px-4 py-2"
                >
                  <ChevronRight className="size-4" aria-hidden /> السابق
                </Link>
              )}
              <span className="text-muted-foreground">
                صفحة {filters.page} من {pages}
              </span>
              {filters.page! < pages && (
                <Link
                  href={href({ page: filters.page! + 1 })}
                  rel="next"
                  className="border-border inline-flex items-center gap-1 rounded-xl border bg-white px-4 py-2"
                >
                  التالي <ChevronLeft className="size-4" aria-hidden />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
