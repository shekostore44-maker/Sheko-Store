import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { requireAdmin } from "@/lib/auth/dal"
import type { Category, CategoryWithCount } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

import { CategoryForm } from "./category-form"
import { CategoryList } from "./category-list"

export const metadata: Metadata = { title: "الأقسام" }

export default async function CategoriesPage(props: PageProps<"/admin/categories">) {
  await requireAdmin()
  const { edit } = await props.searchParams

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order")
    .order("created_at")

  if (error) throw new Error(error.message)

  const categories: CategoryWithCount[] = (data ?? []).map(
    ({ products, ...c }: Category & { products: { count: number }[] }) => ({
      ...c,
      product_count: products?.[0]?.count ?? 0,
    }),
  )
  const editing =
    typeof edit === "string" ? categories.find((c) => c.id === edit) : undefined
  const parents = categories.filter((c) => !c.parent_id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
          الأقسام{" "}
          <span className="text-muted-foreground text-lg">({categories.length})</span>
        </h1>
        {editing && (
          <Link
            href="/admin/categories"
            className="bg-brand-blue inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white"
          >
            <Plus className="size-4" aria-hidden />
            إضافة قسم
          </Link>
        )}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_26rem]">
        <CategoryList
          // Remount with fresh server data after every change.
          key={categories
            .map((c) => `${c.id}:${c.sort_order}:${c.is_active}:${c.name}`)
            .join()}
          categories={categories}
          editingId={editing?.id}
        />
        <CategoryForm key={editing?.id ?? "new"} category={editing} parents={parents} />
      </div>
    </div>
  )
}
