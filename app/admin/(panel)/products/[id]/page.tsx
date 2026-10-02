import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { getCategoryOptions } from "@/lib/catalog/admin-queries"
import type {
  Product,
  ProductImage,
  ProductVariant,
  ProductWithRelations,
} from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

import { ProductForm } from "../product-form"

export const metadata: Metadata = { title: "تعديل منتج" }

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin()
  const { id } = await props.params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const [{ data, error }, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, product_images(url, alt, sort_order), product_variants(id, name, options, price, stock, sku, is_active, sort_order)",
      )
      .eq("id", id)
      .maybeSingle(),
    getCategoryOptions(),
  ])
  if (error) throw new Error(error.message)
  if (!data) notFound()

  const { product_images, product_variants, ...row } = data as Product & {
    product_images: (ProductImage & { sort_order: number })[]
    product_variants: (ProductVariant & { sort_order: number })[]
  }
  const bySortOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order

  const product: ProductWithRelations = {
    ...row,
    price: Number(row.price),
    compare_at_price: row.compare_at_price === null ? null : Number(row.compare_at_price),
    images: [...product_images].sort(bySortOrder).map(({ url, alt }) => ({ url, alt })),
    variants: [...product_variants].sort(bySortOrder).map((v) => ({
      id: v.id,
      name: v.name,
      options: v.options,
      price: v.price === null ? null : Number(v.price),
      stock: v.stock,
      sku: v.sku,
      is_active: v.is_active,
    })),
  }

  return <ProductForm key={product.id} product={product} categories={categories} />
}
