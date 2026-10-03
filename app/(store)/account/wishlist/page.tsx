import { Heart } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ProductGrid } from "@/components/store/product-card"
import { requireCustomer } from "@/lib/auth/dal"
import { CARD_COLUMNS, toCard, type CardRow } from "@/lib/catalog/store-queries"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "المفضلة" }

export default async function WishlistPage() {
  const user = await requireCustomer("/account/wishlist")
  const supabase = await createClient()
  const { data } = await supabase
    .from("wishlist")
    .select(`created_at, product:products!inner(${CARD_COLUMNS}, is_active)`)
    .eq("user_id", user.id)
    .eq("product.is_active", true)
    .order("created_at", { ascending: false })

  const products = ((data ?? []) as unknown as { product: CardRow }[]).map((row) =>
    toCard(row.product),
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-brand-navy text-xl font-bold">المفضلة</h2>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-white p-10 text-center">
          <Heart className="text-brand-blue size-10" aria-hidden />
          <p className="text-brand-navy font-bold">مفيش منتجات في المفضلة</p>
          <p className="text-muted-foreground text-sm">
            اضغط على ♡ في صفحة أي منتج عشان تحفظه هنا وترجعله بعدين.
          </p>
          <Link
            href="/"
            className="bg-brand-navy text-brand-ice mt-2 rounded-xl px-6 py-3 font-semibold"
          >
            تصفّح المنتجات
          </Link>
        </div>
      )}
    </div>
  )
}
