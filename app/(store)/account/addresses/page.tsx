import type { Metadata } from "next"

import { requireCustomer } from "@/lib/auth/dal"
import { getShippingOptions } from "@/lib/cart/queries"
import { createClient } from "@/lib/supabase/server"

import { AddressBook, type SavedAddress } from "./address-book"

export const metadata: Metadata = { title: "عناويني" }

export default async function AddressesPage() {
  const user = await requireCustomer("/account/addresses")
  const supabase = await createClient()
  const [{ data }, governorates] = await Promise.all([
    supabase
      .from("addresses")
      .select("id, governorate_id, city_id, address, phone, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at"),
    getShippingOptions(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-brand-navy text-xl font-bold">عناويني</h2>
      <AddressBook
        addresses={(data ?? []) as SavedAddress[]}
        governorates={governorates}
        defaultPhone={user.phone}
      />
    </div>
  )
}
