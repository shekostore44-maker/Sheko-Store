import "server-only"

import { revalidatePath } from "next/cache"

/** Refresh every store page after the catalog changes. */
export function revalidateCatalog() {
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
