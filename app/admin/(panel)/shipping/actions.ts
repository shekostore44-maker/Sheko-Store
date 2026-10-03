"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { catalogDbError, revalidateCatalog } from "@/lib/catalog/revalidate"
import { fieldErrorsOf } from "@/lib/catalog/schemas"
import type { ActionResult } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

const governorateSchema = z
  .object({
    id: z.number().int().positive(),
    shipping_fee: z
      .number({ error: "اكتب سعر الشحن" })
      .min(0, { error: "السعر مينفعش يبقى بالسالب" })
      .max(100000, { error: "السعر كبير جداً" }),
    min_days: z
      .number()
      .int({ error: "رقم صحيح" })
      .min(1, { error: "يوم على الأقل" })
      .max(60),
    max_days: z.number().int({ error: "رقم صحيح" }).min(1).max(60),
    is_active: z.boolean(),
  })
  .refine((g) => g.max_days >= g.min_days, {
    error: "أقصى مدة لازم تبقى أكبر من أو تساوي أقل مدة",
    path: ["max_days"],
  })
export type GovernorateInput = z.infer<typeof governorateSchema>

export async function saveGovernorate(input: GovernorateInput): Promise<ActionResult> {
  await requireAdmin()
  const parsed = governorateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "راجع القيم", fieldErrors: fieldErrorsOf(parsed.error) }
  }
  const { id, ...values } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from("governorates").update(values).eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }
  revalidateCatalog()
  return { ok: true }
}

/** Turns every governorate on or off at once. */
export async function setAllGovernoratesActive(active: boolean): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from("governorates")
    .update({ is_active: active })
    .neq("is_active", active)
  if (error) return { ok: false, error: catalogDbError(error) }
  revalidateCatalog()
  return { ok: true }
}

export async function addCity(
  governorateId: number,
  name: string,
): Promise<ActionResult<{ id: number; name: string }>> {
  await requireAdmin()
  const clean = name.replace(/\s+/g, " ").trim()
  if (clean.length < 2 || clean.length > 60) {
    return { ok: false, error: "اكتب اسم المدينة (من 2 لـ 60 حرف)" }
  }
  if (!Number.isInteger(governorateId)) return { ok: false, error: "محافظة غير صالحة" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .insert({ governorate_id: governorateId, name: clean, sort_order: 1000 })
    .select("id, name")
    .single()
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "المدينة دي موجودة بالفعل" : catalogDbError(error),
    }
  }
  revalidateCatalog()
  return { ok: true, data }
}

export async function setCityActive(id: number, active: boolean): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from("cities")
    .update({ is_active: active })
    .eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }
  revalidateCatalog()
  return { ok: true }
}

/** Old orders keep the city name (snapshot), so deleting is safe. */
export async function deleteCity(id: number): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("cities").delete().eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }
  revalidateCatalog()
  return { ok: true }
}
