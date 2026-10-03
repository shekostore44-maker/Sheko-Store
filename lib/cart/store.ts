"use client"

import { useSyncExternalStore } from "react"

/**
 * The cart lives in localStorage so guests keep it across visits and tabs.
 * Prices here are a display snapshot only: the server re-prices every order.
 */
export type CartItem = {
  productId: string
  variantId: string | null
  slug: string
  name: string
  variantName: string | null
  image: string | null
  price: number
  quantity: number
  /** Stock when last seen; caps the quantity stepper. */
  maxQuantity: number
}

export const MAX_LINE_QUANTITY = 50
const STORAGE_KEY = "sheko-cart-v1"
const EMPTY: CartItem[] = []

export const cartKey = (item: Pick<CartItem, "productId" | "variantId">) =>
  `${item.productId}:${item.variantId ?? ""}`

let cache: CartItem[] | null = null
const listeners = new Set<() => void>()

function isCartItem(value: unknown): value is CartItem {
  const v = value as CartItem
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.productId === "string" &&
    (v.variantId === null || typeof v.variantId === "string") &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    Number.isInteger(v.quantity) &&
    v.quantity > 0
  )
}

function read(): CartItem[] {
  if (cache) return cache
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    cache = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(items: CartItem[]) {
  cache = items
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Private mode or full storage: the cart still works for this page view.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keep tabs in sync: another tab changed the cart.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cache = null
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

const noopSubscribe = () => () => {}
/** False during server render and hydration, so pages can avoid an empty-cart flash. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

const clampQuantity = (quantity: number, max: number) =>
  Math.max(1, Math.min(quantity, max, MAX_LINE_QUANTITY))

/** Adds to an existing line when the same product/variant is already in the cart. */
export function addToCart(item: Omit<CartItem, "quantity">, quantity: number) {
  const items = read()
  const key = cartKey(item)
  const existing = items.find((i) => cartKey(i) === key)
  const next = existing
    ? items.map((i) =>
        cartKey(i) === key
          ? {
              ...i,
              ...item,
              quantity: clampQuantity(i.quantity + quantity, item.maxQuantity),
            }
          : i,
      )
    : [...items, { ...item, quantity: clampQuantity(quantity, item.maxQuantity) }]
  write(next)
}

export function setQuantity(key: string, quantity: number) {
  write(
    read().map((i) =>
      cartKey(i) === key ? { ...i, quantity: clampQuantity(quantity, i.maxQuantity) } : i,
    ),
  )
}

export function removeFromCart(key: string) {
  write(read().filter((i) => cartKey(i) !== key))
}

/** Replaces the cart, e.g. after refreshing prices and stock from the server. */
export function replaceCart(items: CartItem[]) {
  write(items)
}

export function clearCart() {
  write(EMPTY)
}

/** Current cart outside React (event handlers, effects). */
export function getCart() {
  return read()
}
