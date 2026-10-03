export const ORDER_STATUSES = [
  { key: "new", label: "جديد", className: "bg-brand-blue/10 text-brand-blue" },
  { key: "confirmed", label: "مؤكد", className: "bg-[#eef0ff] text-[#4f46e5]" },
  { key: "processing", label: "جاري التجهيز", className: "bg-[#fff4e0] text-[#8a5300]" },
  { key: "shipped", label: "تم الشحن", className: "bg-[#e6f6ff] text-[#0b6e99]" },
  { key: "delivered", label: "تم التوصيل", className: "bg-success-soft text-success" },
  { key: "cancelled", label: "ملغي", className: "bg-destructive/10 text-destructive" },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]["key"]

export function statusMeta(key: string) {
  return ORDER_STATUSES.find((s) => s.key === key) ?? ORDER_STATUSES[0]
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.some((s) => s.key === value)
}

const dateFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Cairo",
})
export const formatDateTime = (value: string) => dateFormat.format(new Date(value))
