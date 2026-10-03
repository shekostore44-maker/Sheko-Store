import "server-only"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createPublicClient } from "@/lib/supabase/public"

export type ShippingGovernorate = {
  id: number
  name: string
  fee: number
  minDays: number
  maxDays: number
  cities: { id: number; name: string }[]
}

/** Active governorates with their active cities; RLS hides the rest. */
export async function getShippingOptions(): Promise<ShippingGovernorate[]> {
  if (!isSupabaseConfigured) return []
  const supabase = createPublicClient()
  const [govs, cities] = await Promise.all([
    supabase
      .from("governorates")
      .select("id, name, shipping_fee, min_days, max_days")
      .order("sort_order")
      .order("name"),
    supabase
      .from("cities")
      .select("id, name, governorate_id")
      .order("sort_order")
      .order("name")
      .limit(5000),
  ])
  if (govs.error || cities.error) return []

  return govs.data.map((g) => ({
    id: g.id,
    name: g.name,
    fee: Number(g.shipping_fee),
    minDays: g.min_days,
    maxDays: g.max_days,
    cities: cities.data
      .filter((c) => c.governorate_id === g.id)
      .map(({ id, name }) => ({ id, name })),
  }))
}
