export type Category = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  is_active: boolean
}

export type CategoryWithCount = Category & { product_count: number }

export type ProductImage = { url: string; alt: string }

export type ProductVariant = {
  id?: string
  name: string
  options: Record<string, string>
  price: number | null
  stock: number
  sku: string | null
  is_active: boolean
}

export type Product = {
  id: string
  category_id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  stock: number
  is_active: boolean
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
}

export type ProductWithRelations = Product & {
  images: ProductImage[]
  variants: ProductVariant[]
}

/** Result returned by admin Server Actions to the client forms. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
