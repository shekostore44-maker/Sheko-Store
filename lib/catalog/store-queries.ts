import "server-only"

import { cache } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createPublicClient } from "@/lib/supabase/public"

// ---------------------------------------------------------------- types

export type NavCategory = {
  id: string
  name: string
  slug: string
  image_url: string | null
  children: NavCategory[]
}

export type ProductCardData = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  stock: number
  images: { url: string; alt: string }[]
}

export type StoreCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  seo_title: string | null
  seo_description: string | null
  parent: { name: string; slug: string } | null
  children: { id: string; name: string; slug: string }[]
}

export type StoreVariant = {
  id: string
  name: string
  options: Record<string, string>
  price: number | null
  stock: number
}

export type StoreProduct = ProductCardData & {
  short_description: string | null
  description: string | null
  sku: string | null
  seo_title: string | null
  seo_description: string | null
  updated_at: string
  category: {
    id: string
    name: string
    slug: string
    parent: { name: string; slug: string } | null
  }
  variants: StoreVariant[]
}

// -------------------------------------------------------------- helpers

// Product card columns; images ordered, at most two (main + hover image).
const CARD_COLUMNS =
  "id, name, slug, price, compare_at_price, stock, product_images(url, alt, sort_order)"

type CardRow = Omit<ProductCardData, "images" | "price" | "compare_at_price"> & {
  price: number | string
  compare_at_price: number | string | null
  product_images: { url: string; alt: string; sort_order: number }[]
}

function toCard(row: CardRow): ProductCardData {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    stock: row.stock,
    price: Number(row.price),
    compare_at_price: row.compare_at_price === null ? null : Number(row.compare_at_price),
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 2)
      .map(({ url, alt }) => ({ url, alt })),
  }
}

function db() {
  return isSupabaseConfigured ? createPublicClient() : null
}

/** Keeps user text from breaking PostgREST filter syntax. */
export function cleanSearchTerm(term: string) {
  return term
    .replace(/[,()%*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
}

// ------------------------------------------------------------- queries

/** Visible categories as a two-level tree, for the header, footer and home. */
export const getNavCategories = cache(async (): Promise<NavCategory[]> => {
  const supabase = db()
  if (!supabase) return []
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, parent_id")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at")
  if (error) return []

  const rows = data as (Omit<NavCategory, "children"> & { parent_id: string | null })[]
  return rows
    .filter((c) => !c.parent_id)
    .map((parent) => ({
      ...parent,
      children: rows
        .filter((c) => c.parent_id === parent.id)
        .map((child) => ({ ...child, children: [] })),
    }))
})

function activeProducts(supabase: ReturnType<typeof createPublicClient>) {
  return supabase.from("products").select(CARD_COLUMNS).eq("is_active", true)
}
type ProductQuery = ReturnType<typeof activeProducts>

/** Runs a product-card query; `build` adds filters, sorting and limits. */
async function productCards(
  build: (query: ProductQuery) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<ProductCardData[]> {
  const supabase = db()
  if (!supabase) return []
  const { data, error } = await build(activeProducts(supabase))
  if (error || !data) return []
  return (data as CardRow[]).map(toCard)
}

export const getHomeProducts = cache(async () => {
  const [featured, latest, offers] = await Promise.all([
    productCards((q) =>
      q.eq("is_featured", true).order("updated_at", { ascending: false }).limit(8),
    ),
    productCards((q) => q.order("created_at", { ascending: false }).limit(8)),
    productCards((q) =>
      q
        .not("compare_at_price", "is", null)
        .order("updated_at", { ascending: false })
        .limit(8),
    ),
  ])
  return { featured, latest, offers }
})

export const getCategoryBySlug = cache(
  async (slug: string): Promise<StoreCategory | null> => {
    const supabase = db()
    if (!supabase) return null
    const { data: category } = await supabase
      .from("categories")
      .select(
        "id, name, slug, description, image_url, seo_title, seo_description, parent_id",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
    if (!category) return null

    const [{ data: parent }, { data: children }] = await Promise.all([
      category.parent_id
        ? supabase
            .from("categories")
            .select("name, slug")
            .eq("id", category.parent_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("parent_id", category.id)
        .eq("is_active", true)
        .order("sort_order"),
    ])

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
      seo_title: category.seo_title,
      seo_description: category.seo_description,
      parent: parent ?? null,
      children: children ?? [],
    }
  },
)

export type CategoryFilters = {
  sub?: string
  min?: number
  max?: number
  inStock?: boolean
  sort?: "new" | "price_asc" | "price_desc"
  page?: number
}

export const CATEGORY_PAGE_SIZE = 24

export async function getCategoryProducts(
  category: StoreCategory,
  filters: CategoryFilters,
) {
  const supabase = db()
  if (!supabase) return { products: [], total: 0 }

  const sub = category.children.find((c) => c.slug === filters.sub)
  const ids = sub ? [sub.id] : [category.id, ...category.children.map((c) => c.id)]

  let query = supabase
    .from("products")
    .select(CARD_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .in("category_id", ids)
  if (filters.min !== undefined) query = query.gte("price", filters.min)
  if (filters.max !== undefined) query = query.lte("price", filters.max)
  if (filters.inStock) query = query.gt("stock", 0)
  query =
    filters.sort === "price_asc"
      ? query.order("price", { ascending: true })
      : filters.sort === "price_desc"
        ? query.order("price", { ascending: false })
        : query.order("created_at", { ascending: false })

  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * CATEGORY_PAGE_SIZE
  const { data, count, error } = await query.range(from, from + CATEGORY_PAGE_SIZE - 1)
  if (error) return { products: [], total: 0 }
  return { products: (data as CardRow[]).map(toCard), total: count ?? 0 }
}

export const getProductBySlug = cache(
  async (slug: string): Promise<StoreProduct | null> => {
    const supabase = db()
    if (!supabase) return null
    const { data } = await supabase
      .from("products")
      .select(
        `${CARD_COLUMNS}, short_description, description, sku, seo_title, seo_description, updated_at,
       category:categories(id, name, slug, parent_id),
       product_variants(id, name, options, price, stock, is_active, sort_order)`,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
    if (!data) return null

    type Row = CardRow & {
      short_description: string | null
      description: string | null
      sku: string | null
      seo_title: string | null
      seo_description: string | null
      updated_at: string
      category: { id: string; name: string; slug: string; parent_id: string | null }
      product_variants: (StoreVariant & { is_active: boolean; sort_order: number })[]
    }
    const row = data as unknown as Row

    const { data: parent } = row.category.parent_id
      ? await supabase
          .from("categories")
          .select("name, slug")
          .eq("id", row.category.parent_id)
          .maybeSingle()
      : { data: null }

    const card = toCard(row)
    return {
      ...card,
      // The product page shows every image, not just the first two.
      images: [...row.product_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ url, alt }) => ({ url, alt })),
      short_description: row.short_description,
      description: row.description,
      sku: row.sku,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      updated_at: row.updated_at,
      category: {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
        parent: parent ?? null,
      },
      variants: row.product_variants
        .filter((v) => v.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({
          id: v.id,
          name: v.name,
          options: v.options,
          price: v.price === null ? null : Number(v.price),
          stock: v.stock,
        })),
    }
  },
)

export async function getRelatedProducts(product: StoreProduct) {
  return productCards((q) =>
    q
      .eq("category_id", product.category.id)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(4),
  )
}

export async function searchProducts(term: string) {
  const clean = cleanSearchTerm(term)
  if (clean.length < 2) return []
  return productCards((q) =>
    q
      .or(`name.ilike.%${clean}%,short_description.ilike.%${clean}%,sku.ilike.%${clean}%`)
      .order("created_at", { ascending: false })
      .limit(48),
  )
}
