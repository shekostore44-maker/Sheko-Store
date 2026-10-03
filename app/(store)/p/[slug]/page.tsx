import { Banknote, MessageCircle, Truck } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Breadcrumbs, type Crumb } from "@/components/store/breadcrumbs"
import { ProductGrid, SectionHeader } from "@/components/store/product-card"
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/store-queries"
import { decodeParam } from "@/lib/format"
import { sanitizeDescription, textExcerpt } from "@/lib/html"
import { siteConfig } from "@/lib/site"

import { BuyBox } from "./buy-box"
import { ProductGallery } from "./product-gallery"

// Product pages are generated on first visit, then cached. Admin edits refresh
// them immediately; this is only a safety net.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const slug = decodeParam((await props.params).slug)
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const title = product.seo_title || product.name
  const description =
    product.seo_description ||
    product.short_description ||
    textExcerpt(product.description) ||
    `${product.name} من Sheko. شحن لكل المحافظات والدفع عند الاستلام.`
  return {
    title,
    description,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: product.images
        .slice(0, 4)
        .map((img) => ({ url: img.url, alt: img.alt || product.name })),
    },
  }
}

export default async function ProductPage(props: PageProps<"/p/[slug]">) {
  const slug = decodeParam((await props.params).slug)
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const description = sanitizeDescription(product.description)
  const url = `${siteConfig.url}/p/${encodeURIComponent(product.slug)}`

  const crumbs: Crumb[] = [{ label: "الرئيسية", href: "/" }]
  if (product.category.parent) {
    crumbs.push({
      label: product.category.parent.name,
      href: `/c/${product.category.parent.slug}`,
    })
  }
  crumbs.push({ label: product.category.name, href: `/c/${product.category.slug}` })
  crumbs.push({ label: product.name })

  const prices = product.variants.length
    ? product.variants.map((v) => v.price ?? product.price)
    : [product.price]
  const inStock = product.variants.length
    ? product.variants.some((v) => v.stock > 0)
    : product.stock > 0

  // Structured data so Google can show price and availability in results.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.short_description || textExcerpt(product.description, 300) || undefined,
      image: product.images.map((img) => img.url),
      sku: product.sku || undefined,
      brand: { "@type": "Brand", name: siteConfig.name },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EGP",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.label,
        item: crumb.href ? `${siteConfig.url}${crumb.href}` : url,
      })),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can never close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-brand-blue text-sm font-semibold">
              {product.category.name}
            </p>
            <h1 className="text-brand-navy mt-1 text-3xl leading-tight font-bold sm:text-4xl">
              {product.name}
            </h1>
            {product.short_description && (
              <p className="text-brand-slate mt-3 leading-relaxed">
                {product.short_description}
              </p>
            )}
          </div>

          <BuyBox
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images[0]?.url ?? null,
            }}
            price={product.price}
            compareAtPrice={product.compare_at_price}
            stock={product.stock}
            variants={product.variants}
          />

          <ul className="bg-muted flex flex-col gap-3 rounded-2xl p-4 text-sm">
            <li className="flex items-center gap-3">
              <Truck className="text-brand-blue size-5 shrink-0" aria-hidden />
              شحن لكل المحافظات، وسعر الشحن بيظهر حسب محافظتك عند الطلب
            </li>
            <li className="flex items-center gap-3">
              <Banknote className="text-brand-blue size-5 shrink-0" aria-hidden />
              الدفع نقداً عند الاستلام
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="text-success size-5 shrink-0" aria-hidden />
              تأكيد الطلب وأي استفسار عبر واتساب
            </li>
          </ul>
        </div>
      </div>

      {description && (
        <section className="border-border mt-12 rounded-3xl border bg-white p-6 sm:p-8">
          <h2 className="text-brand-navy mb-4 text-2xl font-bold">الوصف</h2>
          <div
            className="prose-sheko text-brand-slate"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title="منتجات مشابهة" href={`/c/${product.category.slug}`} />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
