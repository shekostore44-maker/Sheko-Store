import "server-only"

import { getCurrentUser } from "@/lib/auth/dal"
import { normalizePhone } from "@/lib/cart/schemas"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import {
  DEFAULT_WHATSAPP_TEMPLATE,
  type WhatsappOrder,
  type WhatsappSettings,
} from "./whatsapp"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CustomerOrder = WhatsappOrder & {
  status: string
  created_at: string
  updated_at: string
}

const ORDER_COLUMNS =
  "order_number, customer_name, phone, governorate_name, city_name, address, notes, subtotal, shipping_fee, total, status, created_at, updated_at, order_items(product_name, product_slug, variant_name, quantity, line_total)"
const ORDER_NUMBER = /^SH-\d{1,12}$/

function toCustomerOrder(row: OrderRow): CustomerOrder {
  const { order_items, ...order } = row
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping_fee: Number(order.shipping_fee),
    total: Number(order.total),
    items: order_items.map((i) => ({ ...i, line_total: Number(i.line_total) })),
  }
}

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
  if (!isSupabaseConfigured || !UUID.test(token) || !ORDER_NUMBER.test(number))
    return null
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("order_number", number)
    .eq("public_token", token)
    .maybeSingle<OrderRow>()
  return error || !data ? null : toCustomerOrder(data)
}

/** Order tracking without an account: number AND phone must both match. */
export async function getTrackedOrder(number: string, phone: string) {
  const clean = number.trim().toUpperCase()
  const fullNumber = /^\d+$/.test(clean) ? `SH-${clean}` : clean
  const cleanPhone = normalizePhone(phone)
  if (
    !isSupabaseConfigured ||
    !ORDER_NUMBER.test(fullNumber) ||
    !/^01\d{9}$/.test(cleanPhone)
  ) {
    return null
  }
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("order_number", fullNumber)
    .eq("phone", cleanPhone)
    .maybeSingle<OrderRow>()
  return error || !data ? null : toCustomerOrder(data)
}

export type OrderSummary = {
  order_number: string
  status: string
  total: number
  created_at: string
  item_count: number
}

/** The signed-in customer's orders, newest first. */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  // Filter by user explicitly: RLS also lets admins read every order.
  const { data } = await supabase
    .from("orders")
    .select("order_number, status, total, created_at, order_items(quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)
  return (data ?? []).map((o) => ({
    order_number: o.order_number,
    status: o.status,
    total: Number(o.total),
    created_at: o.created_at,
    item_count: o.order_items.reduce((sum, i) => sum + i.quantity, 0),
  }))
}

/** One of the signed-in customer's own orders. */
export async function getMyOrder(number: string) {
  const user = await getCurrentUser()
  if (!user || !ORDER_NUMBER.test(number)) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("order_number", number)
    .eq("user_id", user.id)
    .maybeSingle<OrderRow>()
  return data ? toCustomerOrder(data) : null
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
