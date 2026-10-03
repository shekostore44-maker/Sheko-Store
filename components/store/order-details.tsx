import { Check, Truck, XCircle } from "lucide-react"
import Link from "next/link"

import { formatPrice, pieceCount } from "@/lib/format"
import type { CustomerOrder } from "@/lib/orders/queries"
import { formatDateTime } from "@/lib/orders/status"
import { fullAddress } from "@/lib/orders/whatsapp"

const STEPS = [
  { key: "new", label: "اتسجل" },
  { key: "confirmed", label: "اتأكد" },
  { key: "processing", label: "بيتجهز" },
  { key: "shipped", label: "اتشحن" },
  { key: "delivered", label: "اتوصل" },
] as const

/** Progress of the order from placed to delivered (or a cancelled banner). */
export function OrderTimeline({ order }: { order: CustomerOrder }) {
  if (order.status === "cancelled") {
    return (
      <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-2xl p-4">
        <XCircle className="size-6 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">الطلب ده اتلغى</p>
          <p className="text-sm">لو عندك سؤال كلمنا على واتساب.</p>
        </div>
      </div>
    )
  }

  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === order.status),
  )
  return (
    <ol className="grid grid-cols-5" aria-label="حالة الطلب">
      {STEPS.map((step, i) => {
        const done = i <= current
        return (
          <li
            key={step.key}
            aria-current={i === current ? "step" : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-4 right-[-50%] left-[50%] h-1 -translate-y-1/2 ${i <= current ? "bg-brand-blue" : "bg-border"}`}
              />
            )}
            <span
              className={`relative grid size-8 place-items-center rounded-full border-2 ${
                done
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-border text-muted-foreground bg-white"
              }`}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={`text-xs sm:text-sm ${i === current ? "text-brand-navy font-bold" : done ? "text-brand-navy" : "text-muted-foreground"}`}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Items, totals, delivery address and payment method. */
export function OrderDetails({ order }: { order: CustomerOrder }) {
  const count = order.items.reduce((sum, i) => sum + i.quantity, 0)
  return (
    <>
      <section className="border-border rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-brand-navy font-bold">تفاصيل الطلب ({pieceCount(count)})</h2>
        <ul className="divide-border mt-3 divide-y text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-2.5">
              <span className="text-brand-navy">
                {item.product_slug ? (
                  <Link
                    href={`/p/${item.product_slug}`}
                    className="hover:text-brand-blue font-semibold"
                  >
                    {item.product_name}
                  </Link>
                ) : (
                  <span className="font-semibold">{item.product_name}</span>
                )}
                {item.variant_name && (
                  <span className="text-muted-foreground"> — {item.variant_name}</span>
                )}
                <span className="text-muted-foreground"> × {item.quantity}</span>
              </span>
              <span className="text-brand-navy shrink-0 font-semibold">
                {formatPrice(item.line_total)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="border-border mt-2 flex flex-col gap-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-slate">المجموع</dt>
            <dd className="text-brand-navy">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-slate">الشحن ({order.governorate_name})</dt>
            <dd className="text-brand-navy">
              {order.shipping_fee ? formatPrice(order.shipping_fee) : "مجاني"}
            </dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt className="text-brand-navy">الإجمالي</dt>
            <dd className="text-brand-navy">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-border grid gap-4 rounded-2xl border bg-white p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div>
          <h2 className="text-brand-navy mb-1 font-bold">التوصيل إلى</h2>
          <p className="text-brand-slate">{order.customer_name}</p>
          <p className="text-brand-slate" dir="ltr">
            {order.phone}
          </p>
          <p className="text-brand-slate">{fullAddress(order)}</p>
        </div>
        <div>
          <h2 className="text-brand-navy mb-1 font-bold">طريقة الدفع</h2>
          <p className="text-brand-slate flex items-center gap-2">
            <Truck className="text-brand-blue size-4" aria-hidden />
            كاش عند الاستلام
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            اتطلب: {formatDateTime(order.created_at)}
          </p>
        </div>
      </section>
    </>
  )
}
