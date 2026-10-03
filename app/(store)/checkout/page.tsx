import type { Metadata } from "next"

import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { getShippingOptions } from "@/lib/cart/queries"

import { CheckoutForm } from "./checkout-form"

export const metadata: Metadata = {
  title: "إتمام الطلب",
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const governorates = await getShippingOptions()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[{ label: "السلة", href: "/cart" }, { label: "إتمام الطلب" }]}
      />
      <h1 className="text-brand-navy mt-3 text-2xl font-bold sm:text-3xl">إتمام الطلب</h1>
      <CheckoutForm governorates={governorates} />
    </div>
  )
}
