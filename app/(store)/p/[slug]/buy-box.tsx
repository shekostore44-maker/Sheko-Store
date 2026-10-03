"use client"

import { Minus, Plus, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { WishlistButton } from "@/components/store/wishlist-button"
import { addToCart } from "@/lib/cart/store"

import type { StoreVariant } from "@/lib/catalog/store-queries"
import { discountPercent, formatNumber, formatPrice, pieceCount } from "@/lib/format"

/** Option names and their values in display order, e.g. اللون → [كحلي، أزرق]. */
function optionGroups(variants: StoreVariant[]) {
  const groups = new Map<string, string[]>()
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.options)) {
      const values = groups.get(name) ?? []
      if (!values.includes(value)) values.push(value)
      groups.set(name, values)
    }
  }
  return [...groups]
}

export function BuyBox({
  product,
  price,
  compareAtPrice,
  stock,
  variants,
}: {
  product: { id: string; slug: string; name: string; image: string | null }
  price: number
  compareAtPrice: number | null
  stock: number
  variants: StoreVariant[]
}) {
  const groups = useMemo(() => optionGroups(variants), [variants])
  // Start on the first variant that is in stock.
  const [selected, setSelected] = useState<Record<string, string>>(
    () => (variants.find((v) => v.stock > 0) ?? variants[0])?.options ?? {},
  )
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  const variant = variants.find((v) =>
    Object.entries(v.options).every(([k, val]) => selected[k] === val),
  )
  const unitPrice = variant?.price ?? price
  const available = variants.length ? (variant?.stock ?? 0) : stock
  const discount = discountPercent(unitPrice, compareAtPrice)

  /** Is there any in-stock variant with this value, given the other choices? */
  const valueInStock = (name: string, value: string) =>
    variants.some(
      (v) =>
        v.options[name] === value &&
        v.stock > 0 &&
        Object.entries(selected).every(([k, val]) => k === name || v.options[k] === val),
    )

  function add() {
    if (available === 0 || (variants.length && !variant)) return
    addToCart(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantName: variant?.name ?? null,
        image: product.image,
        price: unitPrice,
        maxQuantity: available,
      },
      quantity,
    )
    toast.success("اتضاف للسلة", {
      description: variant ? `${product.name} — ${variant.name}` : product.name,
      action: { label: "عرض السلة", onClick: () => router.push("/cart") },
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-heading text-brand-navy text-3xl font-bold">
          {formatPrice(unitPrice)}
        </p>
        {discount > 0 && (
          <>
            <p className="text-muted-foreground text-lg line-through">
              {formatNumber(compareAtPrice!)}
            </p>
            <p className="bg-success-soft text-success rounded-full px-3 py-1 text-sm font-semibold">
              وفّر {formatNumber(compareAtPrice! - unitPrice)} ج.م
            </p>
          </>
        )}
      </div>

      {groups.map(([name, values]) => (
        <fieldset key={name} className="flex flex-col gap-2">
          <legend className="text-brand-navy mb-2 font-semibold">
            {name}: <span className="font-normal">{selected[name]}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const active = selected[name] === value
              const inStock = valueInStock(name, value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelected((s) => ({ ...s, [name]: value }))
                    setQuantity(1)
                  }}
                  aria-pressed={active}
                  className={`min-w-12 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-brand-navy bg-brand-navy text-brand-ice"
                      : inStock
                        ? "border-border text-brand-navy hover:border-brand-navy bg-white"
                        : "border-border text-muted-foreground bg-muted line-through"
                  }`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <p
        className={`text-sm font-semibold ${available === 0 ? "text-destructive" : available <= 5 ? "text-[#8a5300]" : "text-success"}`}
      >
        {available === 0
          ? variants.length && !variant
            ? "الاختيار ده مش متاح"
            : "نفد من المخزون"
          : available <= 5
            ? `متبقي ${pieceCount(available)} فقط`
            : "متوفر"}
      </p>

      <div className="flex gap-3">
        <div className="border-border flex items-center rounded-xl border bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(available || 1, q + 1))}
            aria-label="زيادة الكمية"
            className="text-brand-navy p-3 disabled:opacity-40"
            disabled={quantity >= available}
          >
            <Plus className="size-4" />
          </button>
          <span className="text-brand-navy w-8 text-center font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="تقليل الكمية"
            className="text-brand-navy p-3 disabled:opacity-40"
            disabled={quantity <= 1}
          >
            <Minus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={available === 0}
          className="bg-brand-navy text-brand-ice flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-60"
        >
          <ShoppingBag className="size-5" aria-hidden />
          {available === 0 ? "غير متاح" : "أضف إلى السلة"}
        </button>
        <WishlistButton productId={product.id} slug={product.slug} />
      </div>
    </div>
  )
}
