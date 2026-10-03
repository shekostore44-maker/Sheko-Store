import "server-only"

import { revalidatePath, updateTag } from "next/cache"

import { CATALOG_TAG } from "@/lib/supabase/public"

/**
 * Call from admin Server Actions after the catalog changes: expires the cached
 * catalog data immediately and re-renders every store page.
 */
export function revalidateCatalog() {
  updateTag(CATALOG_TAG)
  revalidatePath("/", "layout")
}

/** Maps Postgres errors from catalog writes to Arabic messages. */
export function catalogDbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("slug")) return "الرابط ده مستخدم قبل كده، غيّره"
    if (error.message.includes("sku")) return "كود المنتج (SKU) ده مستخدم قبل كده"
    return "القيمة دي مستخدمة قبل كده"
  }
  if (error.code === "23503") return "مينفعش: فيه بيانات تانية مرتبطة بالعنصر ده"
  if (error.code === "42501") return "مش مسموحلك بالعملية دي"
  return "حصل خطأ في قاعدة البيانات، جرّب تاني"
}
