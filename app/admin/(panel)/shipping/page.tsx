import type { Metadata } from "next"

import { requireAdmin } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

import { ShippingManager, type AdminGovernorate } from "./shipping-manager"

export const metadata: Metadata = { title: "الشحن" }

export default async function ShippingPage() {
  await requireAdmin()
  const supabase = await createClient()
  const [govs, cities] = await Promise.all([
    supabase
      .from("governorates")
      .select("id, name, shipping_fee, min_days, max_days, is_active")
      .order("sort_order")
      .order("name"),
    supabase
      .from("cities")
      .select("id, name, governorate_id, is_active")
      .order("sort_order")
      .order("name")
      .limit(5000),
  ])
  if (govs.error) throw new Error(govs.error.message)
  if (cities.error) throw new Error(cities.error.message)

  const governorates: AdminGovernorate[] = govs.data.map((g) => ({
    id: g.id,
    name: g.name,
    shipping_fee: Number(g.shipping_fee),
    min_days: g.min_days,
    max_days: g.max_days,
    is_active: g.is_active,
    cities: cities.data
      .filter((c) => c.governorate_id === g.id)
      .map(({ id, name, is_active }) => ({ id, name, is_active })),
  }))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">الشحن</h1>
        <p className="text-muted-foreground mt-1">
          اختار المحافظات اللي بتشحن لها وسعر الشحن لكل واحدة. المحافظات المقفولة مش بتظهر
          للعميل في صفحة الطلب.
        </p>
      </div>
      <ShippingManager initial={governorates} />
    </div>
  )
}
