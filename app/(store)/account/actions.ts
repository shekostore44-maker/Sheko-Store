"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentUser, requireCustomer } from "@/lib/auth/dal"
import { fieldErrorsOf } from "@/lib/catalog/schemas"
import type { ActionResult } from "@/lib/catalog/types"
import { normalizePhone } from "@/lib/cart/schemas"
import { createClient } from "@/lib/supabase/server"

const DB_ERROR = "حصلت مشكلة، جرّب تاني"
const mobile = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z.string().regex(/^01[0125]\d{8}$/, {
      error: "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015",
    }),
  )

// ------------------------------------------------------------------ profile

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, { error: "اكتب اسمك (3 حروف على الأقل)" })
    .max(80, { error: "الاسم طويل جداً" }),
  phone: z.union([z.literal(""), mobile]),
})

export async function saveProfile(input: {
  full_name: string
  phone: string
}): Promise<ActionResult> {
  const user = await requireCustomer("/account/profile")
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "راجع البيانات", fieldErrors: fieldErrorsOf(parsed.error) }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", user.id)
  if (error) return { ok: false, error: DB_ERROR }
  revalidatePath("/account", "layout")
  return { ok: true }
}

// ---------------------------------------------------------------- addresses

const addressSchema = z.object({
  id: z.uuid().optional(),
  governorate_id: z.coerce.number().int().positive({ error: "اختار المحافظة" }),
  city_id: z.coerce.number().int().positive({ error: "اختار المدينة أو المركز" }),
  address: z
    .string()
    .trim()
    .min(8, { error: "اكتب العنوان بالتفصيل" })
    .max(300, { error: "العنوان طويل جداً" }),
  phone: mobile,
  is_default: z.boolean().default(false),
})
export type AddressInput = z.input<typeof addressSchema>

export async function saveAddress(
  input: AddressInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireCustomer("/account/addresses")
  const parsed = addressSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "راجع العنوان", fieldErrors: fieldErrorsOf(parsed.error) }
  }
  const { id, ...values } = parsed.data
  const supabase = await createClient()

  // The city must belong to the chosen governorate.
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("id", values.city_id)
    .eq("governorate_id", values.governorate_id)
    .maybeSingle()
  if (!city)
    return {
      ok: false,
      fieldErrors: { city_id: "اختار المدينة تاني" },
      error: "راجع العنوان",
    }

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
  if (!id && (count ?? 0) >= 10) return { ok: false, error: "أقصى عدد 10 عناوين" }
  // The first address is the default one.
  const isDefault = values.is_default || !count

  if (isDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
  }
  const row = { ...values, is_default: isDefault, user_id: user.id }
  const { data, error } = id
    ? await supabase.from("addresses").update(row).eq("id", id).select("id").single()
    : await supabase.from("addresses").insert(row).select("id").single()
  if (error) return { ok: false, error: DB_ERROR }
  revalidatePath("/account/addresses")
  return { ok: true, data: { id: data.id } }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const user = await requireCustomer("/account/addresses")
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "عنوان غير صالح" }
  const supabase = await createClient()
  const { data: removed, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .select("is_default")
    .maybeSingle()
  if (error) return { ok: false, error: DB_ERROR }

  // Keep one default address when the default one is deleted.
  if (removed?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle()
    if (next)
      await supabase.from("addresses").update({ is_default: true }).eq("id", next.id)
  }
  revalidatePath("/account/addresses")
  return { ok: true }
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  const user = await requireCustomer("/account/addresses")
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "عنوان غير صالح" }
  const supabase = await createClient()
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
  if (error) return { ok: false, error: DB_ERROR }
  revalidatePath("/account/addresses")
  return { ok: true }
}

// ----------------------------------------------------------------- wishlist

/** Whether the product is in the visitor's wishlist (null = signed out). */
export async function getWishlistState(productId: string): Promise<boolean | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (!z.uuid().safeParse(productId).success) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle()
  return !!data
}

export async function setWishlist(
  productId: string,
  saved: boolean,
): Promise<ActionResult | { ok: false; error: string; signIn: true }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "سجّل دخول عشان تحفظ المنتج", signIn: true }
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "منتج غير صالح" }
  const supabase = await createClient()
  const { error } = saved
    ? await supabase
        .from("wishlist")
        .upsert({ user_id: user.id, product_id: productId }, { ignoreDuplicates: true })
    : await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)
  if (error) return { ok: false, error: DB_ERROR }
  revalidatePath("/account/wishlist")
  return { ok: true }
}
