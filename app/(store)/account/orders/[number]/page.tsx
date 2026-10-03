import { ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { OrderDetails, OrderTimeline } from "@/components/store/order-details"
import { requireCustomer } from "@/lib/auth/dal"
import { getMyOrder } from "@/lib/orders/queries"
import { statusMeta } from "@/lib/orders/status"

export const metadata: Metadata = { title: "تفاصيل الطلب" }

export default async function AccountOrderPage(
  props: PageProps<"/account/orders/[number]">,
) {
  const { number } = await props.params
  const orderNumber = decodeURIComponent(number)
  await requireCustomer(`/account/orders/${orderNumber}`)
  const order = await getMyOrder(orderNumber)
  if (!order) notFound()
  const meta = statusMeta(order.status)

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/account"
        className="text-brand-blue flex items-center gap-1 self-start text-sm font-semibold"
      >
        <ChevronRight className="size-4" aria-hidden />
        كل طلباتي
      </Link>
      <section className="border-border flex flex-col gap-6 rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-brand-navy text-xl font-bold">
            طلب{" "}
            <span dir="ltr" className="font-heading">
              {order.order_number}
            </span>
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
        <OrderTimeline order={order} />
      </section>
      <OrderDetails order={order} />
      {order.status === "delivered" && (
        <p className="bg-brand-ice text-brand-navy rounded-2xl p-4 text-sm">
          عجبك اللي اشتريته؟ افتح صفحة المنتج وقيّمه عشان تساعد غيرك يختار.
        </p>
      )}
    </div>
  )
}
