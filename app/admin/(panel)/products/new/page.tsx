import type { Metadata } from "next"

import { requireAdmin } from "@/lib/auth/dal"
import { getCategoryOptions } from "@/lib/catalog/admin-queries"

import { ProductForm } from "../product-form"

export const metadata: Metadata = { title: "منتج جديد" }

export default async function NewProductPage() {
  await requireAdmin()
  const categories = await getCategoryOptions()

  return <ProductForm categories={categories} />
}
