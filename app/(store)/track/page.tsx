import type { Metadata } from "next"

import { TrackForm } from "./track-form"

export const metadata: Metadata = {
  title: "تتبع الطلب",
  description: "تابع حالة طلبك من Sheko برقم الطلب ورقم الموبايل.",
}

export default function TrackPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">تتبع الطلب</h1>
      <p className="text-brand-slate mt-2">
        اكتب رقم الطلب (موجود في رسالة الواتساب وصفحة التأكيد) ورقم الموبايل اللي طلبت
        بيه.
      </p>
      <TrackForm />
    </div>
  )
}
