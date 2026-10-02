"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { catalogDbError, revalidateCatalog } from "@/lib/catalog/revalidate"
import { categorySchema, fieldErrorsOf, type CategoryInput } from "@/lib/catalog/schemas"
import type { ActionResult } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

export async function saveCategory(
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "راجع البيانات المكتوبة",
      fieldErrors: fieldErrorsOf(parsed.error),
    }
  }
  const { id, ...values } = parsed.data
  const supabase = await createClient()

  // Keep the tree two levels deep: main category → sub-category.
  if (values.parent_id) {
    if (values.parent_id === id) {
      return { ok: false, error: "القسم لا يمكن أن يكون تابعاً لنفسه" }
    }
    const { data: parent } = await supabase
      .from("categories")
      .select("parent_id")
      .eq("id", values.parent_id)
      .maybeSingle()
    if (!parent) return { ok: false, error: "القسم الرئيسي المختار غير موجود" }
    if (parent.parent_id) {
      return { ok: false, error: "اختر قسماً رئيسياً (المسموح مستويين فقط)" }
    }
    if (id) {
      const { count } = await supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", id)
      if (count) {
        return { ok: false, error: "القسم ده تحته أقسام فرعية، فلازم يفضل قسم رئيسي" }
      }
    }
  }

  const query = id
    ? supabase.from("categories").update(values).eq("id", id).select("id").single()
    : supabase.from("categories").insert(values).select("id").single()
  const { data, error } = await query

  if (error) {
    return {
      ok: false,
      error: catalogDbError(error),
      fieldErrors: error.code === "23505" ? { slug: "الرابط مستخدم قبل كده" } : undefined,
    }
  }

  revalidateCatalog()
  return { ok: true, data: { id: data.id } }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "قسم غير صالح" }

  const supabase = await createClient()
  const [{ count: children }, { count: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id),
  ])
  if (children) {
    return { ok: false, error: `تحته ${children} قسم فرعي. احذفهم أو انقلهم الأول` }
  }
  if (products) {
    return { ok: false, error: `فيه ${products} منتج. انقلهم لقسم تاني أو احذفهم الأول` }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }

  revalidateCatalog()
  return { ok: true }
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "قسم غير صالح" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }

  revalidateCatalog()
  return { ok: true }
}

/** Saves the order of sibling categories after drag and drop. */
export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin()
  const parsed = z.array(z.uuid()).max(500).safeParse(orderedIds)
  if (!parsed.success) return { ok: false, error: "ترتيب غير صالح" }

  const supabase = await createClient()
  const results = await Promise.all(
    parsed.data.map((id, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: catalogDbError(failed.error) }

  revalidateCatalog()
  return { ok: true }
}
