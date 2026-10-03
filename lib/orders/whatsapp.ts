import { formatNumber } from "@/lib/format"
import { siteConfig } from "@/lib/site"

export type WhatsappSettings = { number: string | null; template: string }

export const DEFAULT_WHATSAPP_TEMPLATE =
  "طلب جديد من متجر Sheko\nرقم الطلب: {order_number}\nالاسم: {name}\nالموبايل: {phone}\nالعنوان: {address}\n\nالمنتجات:\n{items}\n\nالمجموع: {subtotal} ج.م\nالشحن ({governorate}): {shipping} ج.م\nالإجمالي: {total} ج.م\nالدفع: عند الاستلام"

/** Template placeholders the admin can use, with their meaning. */
export const WHATSAPP_VARIABLES = {
  order_number: "رقم الطلب",
  name: "اسم العميل",
  phone: "موبايل العميل",
  address: "العنوان كامل",
  items: "المنتجات وروابطها",
  subtotal: "مجموع المنتجات",
  governorate: "المحافظة",
  shipping: "سعر الشحن",
  total: "الإجمالي",
  notes: "ملاحظات العميل",
} as const

/** "01012345678", "+20 101 234 5678" → "201012345678" (wa.me format). */
export function toWhatsappNumber(value: string | null | undefined) {
  let digits = (value ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith("0")) digits = "2" + digits
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

export type WhatsappOrder = {
  order_number: string
  customer_name: string
  phone: string
  governorate_name: string
  city_name: string | null
  address: string
  notes: string | null
  subtotal: number
  shipping_fee: number
  total: number
  items: {
    product_name: string
    product_slug: string | null
    variant_name: string | null
    quantity: number
    line_total: number
  }[]
}

export function fullAddress(
  order: Pick<WhatsappOrder, "governorate_name" | "city_name" | "address">,
) {
  return [order.governorate_name, order.city_name, order.address]
    .filter(Boolean)
    .join(" – ")
}

export function whatsappMessage(order: WhatsappOrder, template: string) {
  const items = order.items
    .map((item) => {
      const name = item.variant_name
        ? `${item.product_name} (${item.variant_name})`
        : item.product_name
      const line = `• ${name} × ${item.quantity} = ${formatNumber(item.line_total)} ج.م`
      return item.product_slug
        ? `${line}\n${siteConfig.url}/p/${encodeURIComponent(item.product_slug)}`
        : line
    })
    .join("\n")

  const values: Record<keyof typeof WHATSAPP_VARIABLES, string> = {
    order_number: order.order_number,
    name: order.customer_name,
    phone: order.phone,
    address: fullAddress(order),
    items,
    subtotal: formatNumber(order.subtotal),
    governorate: order.governorate_name,
    shipping: formatNumber(order.shipping_fee),
    total: formatNumber(order.total),
    notes: order.notes ?? "",
  }
  const text = template || DEFAULT_WHATSAPP_TEMPLATE
  const message = text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as keyof typeof values] : match,
  )
  // Never lose the customer's notes, even if the template has no {notes}.
  return order.notes && !text.includes("{notes}")
    ? `${message}\n\nملاحظات: ${order.notes}`
    : message
}

export function whatsappUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
