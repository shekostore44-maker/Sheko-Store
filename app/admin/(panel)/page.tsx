import { requireAdmin } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboardPage() {
  await requireAdmin()

  const supabase = await createClient()
  const count = async (table: string, filter?: [string, string | boolean]) => {
    let query = supabase.from(table).select("*", { count: "exact", head: true })
    if (filter) query = query.eq(filter[0], filter[1])
    const { count } = await query
    return count ?? 0
  }

  const [newOrders, products, categories, governorates, cities] = await Promise.all([
    count("orders", ["status", "new"]),
    count("products"),
    count("categories"),
    count("governorates", ["is_active", true]),
    count("cities"),
  ])

  const stats = [
    { label: "طلبات جديدة", value: newOrders },
    { label: "المنتجات", value: products },
    { label: "الأقسام", value: categories },
    { label: "محافظات ظاهرة", value: governorates, hint: `${cities} مدينة ومركز` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">الإحصائيات</h1>

      <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="border-border rounded-2xl border bg-white p-5">
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="font-heading text-brand-navy mt-1 text-3xl font-bold">
              {stat.value}
            </p>
            {stat.hint && <p className="text-brand-blue mt-1 text-sm">{stat.hint}</p>}
          </li>
        ))}
      </ul>

      <div className="border-brand-blue/30 bg-brand-tint/50 text-brand-navy-soft rounded-2xl border border-dashed p-5">
        ابدأ بإضافة الأقسام، وبعدها أضف المنتجات بصورها وأسعارها ومتغيراتها.
      </div>
    </div>
  )
}
