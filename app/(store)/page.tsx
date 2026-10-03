import { CategoryGrid } from "@/components/store/home/category-grid"
import { Hero } from "@/components/store/home/hero"
import { TrustBar } from "@/components/store/home/trust-bar"
import { ProductGrid, SectionHeader } from "@/components/store/product-card"
import { getHomeProducts, getNavCategories } from "@/lib/catalog/store-queries"

// Refreshed instantly when the admin edits the catalog; this is a safety net.
export const revalidate = 3600

export default async function HomePage() {
  const [categories, { featured, latest, offers }] = await Promise.all([
    getNavCategories(),
    getHomeProducts(),
  ])
  const empty = featured.length + latest.length === 0

  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid categories={categories} />

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          <SectionHeader title="منتجات مميزة" />
          <ProductGrid products={featured} priorityCount={2} />
        </section>
      )}

      {latest.length > 0 && (
        <section className="bg-muted/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
            <SectionHeader id="new" title="وصل حديثاً" />
            <ProductGrid products={latest} />
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeader id="offers" title="العروض" />
          <ProductGrid products={offers} />
        </section>
      )}

      {empty && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6">
          <p className="text-brand-navy text-xl font-bold">المنتجات في الطريق</p>
          <p className="text-muted-foreground mt-2">
            تابعنا، أول تشكيلة هتنزل قريب جداً.
          </p>
        </section>
      )}
    </>
  )
}
