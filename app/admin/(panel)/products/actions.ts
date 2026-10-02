"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { catalogDbError, revalidateCatalog } from "@/lib/catalog/revalidate"
import { fieldErrorsOf, productSchema, type ProductInput } from "@/lib/catalog/schemas"
import type { ActionResult } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

const MEDIA_PATH = "/storage/v1/object/public/media/"

export async function saveProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "راجع البيانات المكتوبة",
      fieldErrors: fieldErrorsOf(parsed.error),
    }
  }
  const { id, images, variants, ...values } = parsed.data
  const supabase = await createClient()

  // With variants, the product's stock is the sum of its active variants.
  const stock = variants.length
    ? variants.filter((v) => v.is_active).reduce((sum, v) => sum + v.stock, 0)
    : values.stock
  const row = { ...values, stock }

  const { data: saved, error } = id
    ? await supabase.from("products").update(row).eq("id", id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single()
  if (error) {
    const fieldErrors: Record<string, string> = {}
    if (error.code === "23505" && error.message.includes("slug"))
      fieldErrors.slug = "الرابط مستخدم"
    if (error.code === "23505" && error.message.includes("sku"))
      fieldErrors.sku = "الكود مستخدم"
    return { ok: false, error: catalogDbError(error), fieldErrors }
  }
  const productId = saved.id as string

  // Images: replace the list so order and alt text match the form exactly.
  const { error: delImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
  if (delImagesError) return { ok: false, error: catalogDbError(delImagesError) }
  if (images.length) {
    const { error: imagesError } = await supabase
      .from("product_images")
      .insert(
        images.map((image, index) => ({
          ...image,
          product_id: productId,
          sort_order: index,
        })),
      )
    if (imagesError) return { ok: false, error: catalogDbError(imagesError) }
  }

  // Variants: delete removed ones, update kept ones, insert new ones.
  const keptIds = variants.flatMap((v) => (v.id ? [v.id] : []))
  let removeQuery = supabase.from("product_variants").delete().eq("product_id", productId)
  if (keptIds.length) removeQuery = removeQuery.not("id", "in", `(${keptIds.join(",")})`)
  const { error: removeError } = await removeQuery
  if (removeError) return { ok: false, error: catalogDbError(removeError) }

  for (const [index, { id: variantId, ...variant }] of variants.entries()) {
    const values = { ...variant, product_id: productId, sort_order: index }
    const { error: variantError } = variantId
      ? await supabase
          .from("product_variants")
          .update(values)
          .eq("id", variantId)
          .eq("product_id", productId)
      : await supabase.from("product_variants").insert(values)
    if (variantError) {
      return {
        ok: false,
        error: `المتغير «${variant.name}»: ${catalogDbError(variantError)}`,
        fieldErrors: { [`variants.${index}.sku`]: "راجع الكود" },
      }
    }
  }

  revalidateCatalog()
  return { ok: true, data: { id: productId } }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "منتج غير صالح" }

  const supabase = await createClient()
  const { data: images } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", id)

  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }

  // Best effort: remove the image files too. Past orders keep their own copy of
  // the product name and price, so they stay readable.
  const paths = (images ?? []).flatMap(({ url }: { url: string }) => {
    const at = url.indexOf(MEDIA_PATH)
    return at === -1 ? [] : [decodeURIComponent(url.slice(at + MEDIA_PATH.length))]
  })
  if (paths.length) await supabase.storage.from("media").remove(paths)

  revalidateCatalog()
  return { ok: true }
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin()
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "منتج غير صالح" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) return { ok: false, error: catalogDbError(error) }

  revalidateCatalog()
  return { ok: true }
}
