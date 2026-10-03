"use server"

import { z } from "zod"

import { getProfile } from "@/lib/auth/dal"
import type { ActionResult } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

export type ReviewEligibility =
  | { status: "signed-out" }
  | { status: "not-eligible" }
  | { status: "reviewed"; approved: boolean; rating: number }
  | { status: "can-review" }

export async function getReviewEligibility(
  productId: string,
): Promise<ReviewEligibility> {
  const profile = await getProfile()
  if (!profile) return { status: "signed-out" }
  if (!z.uuid().safeParse(productId).success) return { status: "not-eligible" }

  const supabase = await createClient()
  const [{ data: existing }, { data: allowed }] = await Promise.all([
    supabase
      .from("reviews")
      .select("rating, is_approved")
      .eq("product_id", productId)
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase.rpc("can_review", { p_product_id: productId }),
  ])
  if (existing) {
    return { status: "reviewed", approved: existing.is_approved, rating: existing.rating }
  }
  return allowed ? { status: "can-review" } : { status: "not-eligible" }
}

const reviewSchema = z.object({
  productId: z.uuid(),
  rating: z.number().int().min(1, { error: "اختار عدد النجوم" }).max(5),
  comment: z.string().trim().max(1000, { error: "التعليق طويل جداً" }),
})

/** "أحمد محمود" → "أحمد م." so full names are never shown publicly. */
function displayName(fullName: string) {
  const [first, second] = fullName.trim().split(/\s+/)
  if (!first) return "عميل Sheko"
  return second ? `${first} ${second[0]}.` : first
}

export async function submitReview(
  input: z.input<typeof reviewSchema>,
): Promise<ActionResult> {
  const profile = await getProfile()
  if (!profile) return { ok: false, error: "سجّل دخول الأول" }
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "راجع التقييم" }
  }

  const supabase = await createClient()
  // RLS checks that this customer received the product.
  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    user_id: profile.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    author_name: displayName(profile.fullName),
  })
  if (error) {
    if (error.code === "23505") return { ok: false, error: "إنت قيّمت المنتج ده قبل كده" }
    if (error.code === "42501") {
      return { ok: false, error: "التقييم متاح بس بعد ما طلب فيه المنتج ده يوصلك" }
    }
    return { ok: false, error: "حصلت مشكلة، جرّب تاني" }
  }
  return { ok: true }
}
