import type { Metadata } from "next"

import { CartView } from "./cart-view"

export const metadata: Metadata = {
  title: "سلة المشتريات",
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">سلة المشتريات</h1>
      <CartView />
    </div>
  )
}
