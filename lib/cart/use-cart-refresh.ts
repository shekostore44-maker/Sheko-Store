"use client"

import { useCallback, useEffect, useState } from "react"

import { quoteCart } from "./actions"
import { cartKey, getCart, replaceCart, type CartItem } from "./store"

/**
 * Re-checks the cart against the server on mount: updates prices and stock,
 * drops items that can't be bought anymore, and explains what changed.
 */
export function useCartRefresh() {
  const [checking, setChecking] = useState(true)
  const [notices, setNotices] = useState<string[]>([])

  const refresh = useCallback(async () => {
    const items = getCart()
    if (!items.length) {
      setChecking(false)
      return
    }
    setChecking(true)
    let quotes: Awaited<ReturnType<typeof quoteCart>>
    try {
      quotes = await quoteCart(
        items.map(({ productId, variantId }) => ({ productId, variantId })),
      )
    } catch {
      setChecking(false)
      return
    }

    const changes: string[] = []
    const next: CartItem[] = []
    // Use the latest cart: the customer may have edited it while we waited.
    for (const item of getCart()) {
      const key = cartKey(item)
      if (!(key in quotes)) {
        next.push(item)
        continue
      }
      const quote = quotes[key]
      const label = item.variantName ? `${item.name} (${item.variantName})` : item.name
      if (!quote || quote.stock <= 0) {
        changes.push(`«${label}» مبقاش متاح واتشال من السلة`)
        continue
      }
      if (quote.price !== item.price) changes.push(`سعر «${label}» اتغير`)
      if (item.quantity > quote.stock) {
        changes.push(`المتاح من «${label}» ${quote.stock} بس، فعدّلنا الكمية`)
      }
      next.push({
        ...item,
        name: quote.name,
        slug: quote.slug,
        image: quote.image,
        variantName: quote.variantName,
        price: quote.price,
        maxQuantity: quote.stock,
        quantity: Math.min(item.quantity, quote.stock),
      })
    }
    replaceCart(next)
    setNotices(changes)
    setChecking(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the server once on mount
    void refresh()
  }, [refresh])

  return { checking, notices, refresh }
}
