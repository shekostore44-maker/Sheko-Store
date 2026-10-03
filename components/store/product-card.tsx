import { ImageOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import type { ProductCardData } from "@/lib/catalog/store-queries"
import { discountPercent, formatNumber, formatPrice } from "@/lib/format"

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData
  priority?: boolean
}) {
  const [main, hover] = product.images
  const discount = discountPercent(product.price, product.compare_at_price)
  const soldOut = product.stock === 0

  return (
    <Link href={`/p/${product.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef2f9]">
        {main ? (
          <>
            <Image
              src={main.url}
              alt={main.alt || product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={`object-contain p-4 transition duration-500 ${hover ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
            />
            {hover && (
              <Image
                src={hover.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-contain p-4 opacity-0 transition duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <ImageOff
            className="text-muted-foreground absolute inset-0 m-auto size-8"
            aria-hidden
          />
        )}
        {soldOut ? (
          <span className="bg-brand-navy/85 absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-white">
            نفد
          </span>
        ) : discount > 0 ? (
          <span className="bg-destructive absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-white">
            خصم {discount}%
          </span>
        ) : null}
      </div>
      <h3 className="text-brand-navy group-hover:text-brand-blue line-clamp-2 text-sm leading-snug font-semibold transition-colors sm:text-base">
        {product.name}
      </h3>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-brand-navy font-bold">{formatPrice(product.price)}</span>
        {discount > 0 && (
          <span className="text-muted-foreground text-sm line-through">
            {formatNumber(product.compare_at_price!)}
          </span>
        )}
      </p>
    </Link>
  )
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductCardData[]
  priorityCount?: number
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}

export function SectionHeader({
  id,
  title,
  href,
  linkLabel = "عرض الكل",
}: {
  id?: string
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div id={id} className="mb-6 flex scroll-mt-28 items-center justify-between gap-3">
      <h2 className="text-brand-navy text-2xl font-bold sm:text-3xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-brand-blue shrink-0 font-semibold hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
