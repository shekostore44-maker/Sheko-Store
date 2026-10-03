import { Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ProductGrid } from "@/components/store/product-card"
import { getNavCategories, searchProducts } from "@/lib/catalog/store-queries"
import { resultCount } from "@/lib/format"

export const metadata: Metadata = {
  title: "البحث",
  // Search result pages are not real content; keep them out of Google.
  robots: { index: false, follow: true },
}

export default async function SearchPage(props: PageProps<"/search">) {
  const raw = (await props.searchParams).q
  const q = (typeof raw === "string" ? raw : "").trim()
  const [results, categories] = await Promise.all([
    q.length >= 2 ? searchProducts(q) : Promise.resolve([]),
    getNavCategories(),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">البحث</h1>
      <form action="/search" role="search" className="relative mt-4 max-w-2xl">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="اكتب اسم المنتج…"
          aria-label="ابحث عن منتج"
          autoFocus={!q}
          className="border-border focus-visible:border-brand-blue focus-visible:ring-ring/30 h-14 w-full rounded-2xl border-2 bg-white ps-12 pe-28 text-base outline-none focus-visible:ring-4"
        />
        <button
          type="submit"
          className="bg-brand-navy text-brand-ice absolute top-1/2 left-2 h-10 -translate-y-1/2 rounded-xl px-5 font-semibold"
        >
          بحث
        </button>
      </form>

      <div className="mt-8">
        {q.length === 1 && <p className="text-muted-foreground">اكتب حرفين على الأقل.</p>}

        {q.length >= 2 && (
          <p className="text-muted-foreground mb-6">
            {results.length
              ? `${resultCount(results.length)} لـ «${q}»`
              : `مفيش نتائج لـ «${q}». جرّب كلمة تانية أو تصفّح الأقسام.`}
          </p>
        )}

        {results.length > 0 && <ProductGrid products={results} priorityCount={4} />}

        {results.length === 0 && categories.length > 0 && (
          <div>
            <h2 className="text-brand-navy mb-3 font-bold">تصفّح الأقسام</h2>
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/c/${c.slug}`}
                    className="border-border text-brand-navy hover:border-brand-blue inline-block rounded-full border bg-white px-4 py-2 font-medium"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
