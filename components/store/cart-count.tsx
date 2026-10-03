"use client"

import { cartCount, useCart } from "@/lib/cart/store"
import { formatNumber } from "@/lib/format"

/** Live number of items in the cart (0 until the browser cart is read). */
export function CartCount({ className }: { className?: string }) {
  const count = cartCount(useCart())
  return (
    <span className={className} aria-label={`${formatNumber(count)} في السلة`}>
      {count > 99 ? "99+" : formatNumber(count)}
    </span>
  )
}

/** Small badge that only shows when the cart has items. */
export function CartBadge() {
  const count = cartCount(useCart())
  if (!count) return null
  return (
    <span className="bg-brand-blue absolute -end-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full px-1 text-[0.65rem] leading-4.5 font-bold text-white">
      {count > 99 ? "99+" : formatNumber(count)}
    </span>
  )
}
