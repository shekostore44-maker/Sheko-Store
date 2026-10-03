import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { OrderDetails } from "@/components/store/order-details"
import { getCustomerOrder, getWhatsappSettings } from "@/lib/orders/queries"
import { toWhatsappNumber, whatsappMessage, whatsappUrl } from "@/lib/orders/whatsapp"

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

      <div className="mt-6 flex flex-col gap-6">
        <OrderDetails order={order} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm">
        <p className="text-brand-slate">
          تقدر تتابع حالة طلبك في أي وقت من{" "}
          <Link href="/track" className="text-brand-blue font-semibold">
            تتبع الطلب
          </Link>{" "}
          برقم الطلب ورقم موبايلك.
        </p>
        <Link href="/" className="text-brand-blue font-semibold">
          ← رجوع للتسوق
        </Link>
      </div>
    </div>
  )
}
