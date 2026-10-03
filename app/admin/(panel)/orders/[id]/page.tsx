import { ChevronRight, ExternalLink, MessageCircle, Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"

import { Section } from "@/components/admin/field"
import { requireAdmin } from "@/lib/auth/dal"
import { formatPrice } from "@/lib/format"
import { formatDateTime, statusMeta } from "@/lib/orders/status"
import { fullAddress, toWhatsappNumber, whatsappUrl } from "@/lib/orders/whatsapp"
import { createClient } from "@/lib/supabase/server"

import { StatusChanger } from "./status-changer"

export const metadata: Metadata = { title: "تفاصيل الطلب" }

type OrderDetail = {
  id: string
  order_number: string
  customer_name: string
  phone: string
  governorate_name: string
  city_name: string | null
  address: string
  notes: string | null
  subtotal: number
  shipping_fee: number
  discount: number
  total: number
  status: string
  created_at: string
  updated_at: string
  order_items: {
    id: string
    product_id: string | null
    product_name: string
    product_slug: string | null
    variant_name: string | null
    unit_price: number
    quantity: number
    line_total: number
  }[]
}

export default async function OrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin()
  const { id } = await props.params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, governorate_name, city_name, address, notes, subtotal, shipping_fee, discount, total, status, created_at, updated_at, order_items(id, product_id, product_name, product_slug, variant_name, unit_price, quantity, line_total)",
    )
    .eq("id", id)
    .maybeSingle<OrderDetail>()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  const order = data

  // Opening the order counts as reading its notification.
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("order_id", id)
    .eq("is_read", false)

  const meta = statusMeta(order.status)
  const customerWa = toWhatsappNumber(order.phone)

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <Link
        href="/admin/orders"
        className="text-brand-blue flex items-center gap-1 self-start text-sm font-semibold"
      >
        <ChevronRight className="size-4" aria-hidden />
        كل الطلبات
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
          طلب{" "}
          <span dir="ltr" className="font-heading">
            {order.order_number}
          </span>
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.className}`}
        >
          {meta.label}
        </span>
        <span className="text-muted-foreground text-sm">
          {formatDateTime(order.created_at)}
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          <Section title="المنتجات">
            <ul className="divide-border -my-2 divide-y">
              {order.order_items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-brand-navy font-semibold">
                      {item.product_name}
                      {item.product_slug && (
                        <a
                          href={`/p/${item.product_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="افتح المنتج في المتجر"
                          className="text-brand-blue ms-1.5 inline-block align-middle"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </p>
                    {item.variant_name && (
                      <p className="text-muted-foreground text-sm">{item.variant_name}</p>
                    )}
                  </div>
                  <p className="text-brand-slate text-sm">
                    {formatPrice(Number(item.unit_price))} × {item.quantity} ={" "}
                    <span className="text-brand-navy font-bold">
                      {formatPrice(Number(item.line_total))}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <dl className="border-border flex flex-col gap-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-slate">المجموع</dt>
                <dd>{formatPrice(Number(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-slate">الشحن ({order.governorate_name})</dt>
                <dd>{formatPrice(Number(order.shipping_fee))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-brand-slate">الخصم</dt>
                  <dd>-{formatPrice(Number(order.discount))}</dd>
                </div>
              )}
              <div className="text-brand-navy flex justify-between text-base font-bold">
                <dt>الإجمالي (كاش عند الاستلام)</dt>
                <dd>{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>
          </Section>

          <Section title="العميل والتوصيل">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">الاسم</dt>
                <dd className="text-brand-navy font-semibold">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">الموبايل</dt>
                <dd className="text-brand-navy font-semibold" dir="ltr">
                  {order.phone}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">العنوان</dt>
                <dd className="text-brand-navy">{fullAddress(order)}</dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">ملاحظات العميل</dt>
                  <dd className="bg-brand-ice text-brand-navy mt-1 rounded-lg p-3 whitespace-pre-wrap">
                    {order.notes}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${order.phone}`}
                className="border-border text-brand-navy flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
              >
                <Phone className="size-4" aria-hidden />
                اتصال
              </a>
              {customerWa && (
                <a
                  href={whatsappUrl(
                    customerWa,
                    `أهلاً ${order.customer_name}، معاك متجر Sheko بخصوص طلبك رقم ${order.order_number}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  واتساب العميل
                </a>
              )}
            </div>
          </Section>
        </div>

        <Section title="حالة الطلب">
          <StatusChanger id={order.id} status={order.status} />
          <p className="text-muted-foreground text-xs">
            آخر تحديث: {formatDateTime(order.updated_at)}
          </p>
        </Section>
      </div>
    </div>
  )
}
