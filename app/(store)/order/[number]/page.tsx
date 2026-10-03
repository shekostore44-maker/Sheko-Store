import { CheckCircle2, Truck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { pieceCount, formatPrice } from "@/lib/format"
import { getCustomerOrder, getWhatsappSettings } from "@/lib/orders/queries"
import {
  fullAddress,
  toWhatsappNumber,
  whatsappMessage,
  whatsappUrl,
} from "@/lib/orders/whatsapp"

import { WhatsappButton } from "./whatsapp-button"

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false, follow: false },
}

export default async function OrderPage(props: PageProps<"/order/[number]">) {
  const [{ number }, query] = await Promise.all([props.params, props.searchParams])
  const token = typeof query.t === "string" ? query.t : ""
  const [order, settings] = await Promise.all([
    getCustomerOrder(decodeURIComponent(number), token),
    getWhatsappSettings(),
  ])
  if (!order) notFound()

  const waNumber = toWhatsappNumber(settings.number)
  const waUrl = waNumber
    ? whatsappUrl(waNumber, whatsappMessage(order, settings.template))
    : null
  const count = order.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-success-soft text-success grid size-16 place-items-center rounded-full">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
          شكراً يا {order.customer_name.split(" ")[0]}، طلبك وصلنا!
        </h1>
        <p className="text-brand-slate">
          رقم الطلب{" "}
          <span className="text-brand-navy font-heading font-bold" dir="ltr">
            {order.order_number}
          </span>
        </p>
      </div>

      {waUrl ? (
        <div className="border-border mt-8 flex flex-col items-center gap-3 rounded-2xl border bg-white p-6 text-center">
          <p className="text-brand-navy font-semibold">
            خطوة أخيرة: ابعتلنا تفاصيل الطلب على واتساب عشان نأكده معاك بسرعة.
          </p>
          <WhatsappButton
            url={waUrl}
            autoOpen={query.new === "1"}
            orderNumber={order.order_number}
          />
        </div>
      ) : (
        <p className="bg-brand-ice text-brand-navy mt-8 rounded-2xl p-5 text-center">
          هنكلمك على <span dir="ltr">{order.phone}</span> قريب عشان نأكد الطلب.
        </p>
      )}

      <section className="border-border mt-6 rounded-2xl border bg-white p-5 sm:p-6">
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

      <section className="border-border mt-6 grid gap-4 rounded-2xl border bg-white p-5 text-sm sm:grid-cols-2 sm:p-6">
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
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-brand-blue font-semibold">
          ← رجوع للتسوق
        </Link>
      </div>
    </div>
  )
}
