"use server"

import { z } from "zod"

import { revalidateCatalog } from "@/lib/catalog/revalidate"
import { fieldErrorsOf } from "@/lib/catalog/schemas"
import type { ActionResult } from "@/lib/catalog/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createPublicClient } from "@/lib/supabase/public"

import { cartLinesSchema, checkoutSchema, type CheckoutInput } from "./schemas"

/** Current state of one cart line; `null` when it can no longer be bought. */
export type CartQuote = {
  name: string
  slug: string
  image: string | null
  variantName: string | null
  price: number
  stock: number
} | null

type QuoteRow = {
  id: string
  name: string
  slug: string
  price: number | string
  stock: number
  product_images: { url: string; sort_order: number }[]
  product_variants: {
    id: string
    name: string
    price: number | string | null
    stock: number
  }[]
}

/** Fresh prices and stock for the cart, keyed by "productId:variantId". */
export async function quoteCart(
  lines: { productId: string; variantId: string | null }[],
): Promise<Record<string, CartQuote>> {
  const parsed = z
    .array(z.object({ productId: z.uuid(), variantId: z.uuid().nullable() }))
    .max(50)
    .safeParse(lines)
  if (!parsed.success || !parsed.data.length || !isSupabaseConfigured) return {}

  // RLS only returns active products and active variants.
  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      "id, name, slug, price, stock, product_images(url, sort_order), product_variants(id, name, price, stock)",
    )
    .eq("is_active", true)
    .in("id", [...new Set(parsed.data.map((l) => l.productId))])
  if (error) return {}

  const products = new Map((data as QuoteRow[]).map((p) => [p.id, p]))
  const quotes: Record<string, CartQuote> = {}
  for (const line of parsed.data) {
    const key = `${line.productId}:${line.variantId ?? ""}`
    const product = products.get(line.productId)
    if (!product) {
      quotes[key] = null
      continue
    }
    const image =
      [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      null
    const variants = product.product_variants ?? []
    if (line.variantId) {
      const variant = variants.find((v) => v.id === line.variantId)
      quotes[key] = variant
        ? {
            name: product.name,
            slug: product.slug,
            image,
            variantName: variant.name,
            price: Number(variant.price ?? product.price),
            stock: variant.stock,
          }
        : null
    } else {
      // A product that now has variants needs a choice on its page.
      quotes[key] = variants.length
        ? null
        : {
            name: product.name,
            slug: product.slug,
            image,
            variantName: null,
            price: Number(product.price),
            stock: product.stock,
          }
    }
  }
  return quotes
}

/** Arabic text for the errors raised by place_order() in the database. */
function orderError(message: string) {
  const colon = message.indexOf(":")
  const code = colon < 0 ? message : message.slice(0, colon)
  const detail = colon < 0 ? "" : message.slice(colon + 1)
  switch (code) {
    case "GOVERNORATE_UNAVAILABLE":
      return "الشحن للمحافظة دي مش متاح حالياً، اختار محافظة تانية"
    case "CITY_UNAVAILABLE":
      return "اختار المدينة أو المركز من القائمة تاني"
    case "EMPTY_CART":
      return "السلة فاضية"
    case "INVALID_QUANTITY":
      return "فيه كمية مش صحيحة في السلة"
    case "OUT_OF_STOCK":
      return `الكمية المطلوبة من «${detail.trim()}» مش متوفرة دلوقتي، قلّل الكمية`
    case "VARIANT_REQUIRED":
      return `لازم تختار الاختيار المناسب لـ «${detail.trim()}» من صفحة المنتج`
    case "PRODUCT_UNAVAILABLE":
      return "فيه منتج في السلة مبقاش متاح، راجع السلة"
    default:
      return "حصلت مشكلة وإحنا بنسجل الطلب، جرّب تاني بعد شوية"
  }
}

export async function placeOrder(input: {
  customer: CheckoutInput
  items: unknown
  /** Honeypot: hidden from people, filled by bots. */
  website?: string
}): Promise<
  ActionResult<{ orderNumber: string; token: string }> & { refreshCart?: boolean }
> {
  if (input.website) return { ok: false, error: "تعذّر إرسال الطلب" }

  const customer = checkoutSchema.safeParse(input.customer)
  if (!customer.success) {
    return {
      ok: false,
      error: "راجع البيانات المكتوبة باللون الأحمر",
      fieldErrors: fieldErrorsOf(customer.error),
    }
  }
  const items = cartLinesSchema.safeParse(input.items)
  if (!items.success)
    return { ok: false, error: "السلة فاضية أو فيها منتج مش صحيح", refreshCart: true }
  if (!isSupabaseConfigured) return { ok: false, error: "المتجر مش متصل بقاعدة البيانات" }

  const c = customer.data
  const { data, error } = await createAdminClient()
    .rpc("place_order", {
      p_order: {
        customer_name: c.name,
        phone: c.phone,
        governorate_id: c.governorateId,
        city_id: c.cityId,
        address: c.address,
        notes: c.notes,
        items: items.data.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId,
          quantity: i.quantity,
        })),
      },
    })
    .single<{
      order_id: string
      order_number: string
      public_token: string
      total: number
    }>()

  if (error || !data) {
    if (error) console.error("place_order failed:", error.message)
    const message = orderError(error?.message ?? "")
    return {
      ok: false,
      error: message,
      refreshCart: /OUT_OF_STOCK|PRODUCT_|VARIANT_|QUANTITY/.test(error?.message ?? ""),
    }
  }

  // Stock changed: refresh cached product pages.
  revalidateCatalog()
  return { ok: true, data: { orderNumber: data.order_number, token: data.public_token } }
}
