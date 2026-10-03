import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"

import {
  DEFAULT_WHATSAPP_TEMPLATE,
  type WhatsappOrder,
  type WhatsappSettings,
} from "./whatsapp"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CustomerOrder = WhatsappOrder & { status: string; created_at: string }

type OrderRow = Omit<CustomerOrder, "subtotal" | "shipping_fee" | "total" | "items"> & {
  subtotal: number | string
  shipping_fee: number | string
  total: number | string
  order_items: (Omit<WhatsappOrder["items"][number], "line_total"> & {
    line_total: number | string
  })[]
}

/**
 * A guest's own order, found by number AND its secret token, so order
 * numbers can't be guessed to read other customers' details.
 */
export async function getCustomerOrder(number: string, token: string) {
  if (!isSupabaseConfigured || !UUID.test(token) || !/^SH-\d{1,12}$/.test(number))
    return null
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      "order_number, customer_name, phone, governorate_name, city_name, address, notes, subtotal, shipping_fee, total, status, created_at, order_items(product_name, product_slug, variant_name, quantity, line_total)",
    )
    .eq("order_number", number)
    .eq("public_token", token)
    .maybeSingle<OrderRow>()
  if (error || !data) return null

  const { order_items, ...order } = data
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping_fee: Number(order.shipping_fee),
    total: Number(order.total),
    items: order_items.map((i) => ({ ...i, line_total: Number(i.line_total) })),
  } satisfies CustomerOrder
}

/** WhatsApp number and message template (private setting; server only). */
export async function getWhatsappSettings(): Promise<WhatsappSettings> {
  const fallback = { number: null, template: DEFAULT_WHATSAPP_TEMPLATE }
  if (!isSupabaseConfigured) return fallback
  const { data } = await createAdminClient()
    .from("settings")
    .select("value")
    .eq("key", "whatsapp")
    .maybeSingle<{ value: Partial<WhatsappSettings> }>()
  return {
    number: data?.value.number ?? null,
    template: data?.value.template || DEFAULT_WHATSAPP_TEMPLATE,
  }
}
