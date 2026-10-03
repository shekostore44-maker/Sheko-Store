"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { revalidateCatalog } from "@/lib/catalog/revalidate"
import type { ActionResult } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

export async function setReviewApproved(
  id: string,
  approved: boolean,
): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "تقييم غير صالح" }
  const supabase = await createClient()
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", id)
  if (error) return { ok: false, error: "حصل خطأ، جرّب تاني" }
  // Approved reviews show on (cached) product pages.
  revalidateCatalog()
  revalidatePath("/admin/reviews")
  return { ok: true }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "تقييم غير صالح" }
  const supabase = await createClient()
  const { error } = await supabase.from("reviews").delete().eq("id", id)
  if (error) return { ok: false, error: "حصل خطأ، جرّب تاني" }
  revalidateCatalog()
  revalidatePath("/admin/reviews")
  return { ok: true }
}
