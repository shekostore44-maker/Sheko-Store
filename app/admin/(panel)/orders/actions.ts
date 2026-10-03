"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { revalidateCatalog } from "@/lib/catalog/revalidate"
import type { ActionResult } from "@/lib/catalog/types"
import { isOrderStatus } from "@/lib/orders/status"
import { createClient } from "@/lib/supabase/server"

export async function setOrderStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success || !isOrderStatus(status)) {
    return { ok: false, error: "بيانات غير صالحة" }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_order_status", {
    p_order_id: id,
    p_status: status,
  })
  if (error) {
    if (error.code === "23514" || error.message.includes("stock")) {
      return {
        ok: false,
        error: "المخزون مش كفاية عشان ترجّع الطلب ده. زوّد المخزون الأول.",
      }
    }
    if (error.message.includes("ORDER_NOT_FOUND"))
      return { ok: false, error: "الطلب مش موجود" }
    return { ok: false, error: "حصل خطأ، جرّب تاني" }
  }
  // Cancelling or restoring changes stock shown in the store.
  revalidateCatalog()
  revalidatePath("/admin/orders")
  return { ok: true }
}

export async function markNotificationsRead(ids?: string[]): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false)
  if (ids?.length) {
    if (!z.array(z.uuid()).max(100).safeParse(ids).success) {
      return { ok: false, error: "بيانات غير صالحة" }
    }
    query = query.in("id", ids)
  }
  const { error } = await query
  if (error) return { ok: false, error: "حصل خطأ، جرّب تاني" }
  return { ok: true }
}
