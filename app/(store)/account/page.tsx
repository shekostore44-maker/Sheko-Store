import { CheckCircle2, ChevronLeft, PackageOpen } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { requireCustomer } from "@/lib/auth/dal"
import { formatPrice, pieceCount } from "@/lib/format"
import { getMyOrders } from "@/lib/orders/queries"
import { formatDateTime, statusMeta } from "@/lib/orders/status"

export const metadata: Metadata = { title: "طلباتي" }

export default async function AccountOrdersPage(props: PageProps<"/account">) {
  await requireCustomer()
  const [sp, orders] = await Promise.all([props.searchParams, getMyOrders()])
  const notice =
    sp.welcome === "1"
      ? "حسابك اتفعّل! أهلاً بيك في Sheko."
      : sp.password === "updated"
        ? "كلمة المرور اتغيرت بنجاح."
        : null

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p
          role="status"
          className="bg-success-soft text-success flex items-center gap-2 rounded-2xl p-4 font-semibold"
        >
          <CheckCircle2 className="size-5" aria-hidden />
          {notice}
        </p>
      )}
      <h2 className="text-brand-navy text-xl font-bold">طلباتي</h2>
      {orders.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-white p-10 text-center">
          <PackageOpen className="text-brand-blue size-10" aria-hidden />
          <p className="text-brand-navy font-bold">لسه معملتش طلبات من حسابك</p>
          <p className="text-muted-foreground text-sm">
            الطلبات اللي بتعملها وإنت مسجّل دخول بتظهر هنا. لو طلبت كضيف، تقدر تتابعه من{" "}
            <Link href="/track" className="text-brand-blue font-semibold">
              تتبع الطلب
            </Link>
            .
          </p>
          <Link
            href="/"
            className="bg-brand-navy text-brand-ice mt-2 rounded-xl px-6 py-3 font-semibold"
          >
            ابدأ التسوق
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const meta = statusMeta(o.status)
            return (
              <li key={o.order_number}>
                <Link
                  href={`/account/orders/${o.order_number}`}
                  className="border-border hover:border-brand-blue flex items-center gap-4 rounded-2xl border bg-white p-4 transition"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span dir="ltr" className="text-brand-navy font-heading font-bold">
                        {o.order_number}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {formatDateTime(o.created_at)} · {pieceCount(o.item_count)}
                    </p>
                  </div>
                  <span className="text-brand-navy font-bold">
                    {formatPrice(o.total)}
                  </span>
                  <ChevronLeft className="text-muted-foreground size-5" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
