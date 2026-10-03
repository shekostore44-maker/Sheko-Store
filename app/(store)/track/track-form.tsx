"use client"

import { useActionState } from "react"

import { AuthField, FormAlert, SubmitButton } from "@/components/store/auth-ui"
import { OrderDetails, OrderTimeline } from "@/components/store/order-details"
import { statusMeta } from "@/lib/orders/status"

import { trackOrder, type TrackState } from "./actions"

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(
    trackOrder,
    undefined,
  )
  const order = state?.order

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form
        action={action}
        className="border-border grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
      >
        <AuthField
          id="number"
          label="رقم الطلب"
          dir="ltr"
          placeholder="SH-10001"
          required
          key={`n-${state?.values?.number ?? ""}`}
          defaultValue={state?.values?.number}
          className="text-end uppercase"
        />
        <AuthField
          id="phone"
          label="رقم الموبايل"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="01xxxxxxxxx"
          required
          key={`p-${state?.values?.phone ?? ""}`}
          defaultValue={state?.values?.phone}
          className="text-end"
        />
        <SubmitButton pending={pending}>{pending ? "بندوّر…" : "تتبع"}</SubmitButton>
      </form>

      <FormAlert>{state?.error}</FormAlert>

      {order && (
        <div className="flex flex-col gap-6" aria-live="polite">
          <section className="border-border flex flex-col gap-6 rounded-2xl border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-brand-navy font-bold">
                طلب{" "}
                <span dir="ltr" className="font-heading">
                  {order.order_number}
                </span>
              </p>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${statusMeta(order.status).className}`}
              >
                {statusMeta(order.status).label}
              </span>
            </div>
            <OrderTimeline order={order} />
          </section>
          <OrderDetails order={order} />
        </div>
      )}
    </div>
  )
}
