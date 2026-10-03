import Image from "next/image"
import Link from "next/link"

import { SectionHeader } from "@/components/store/product-card"
import type { NavCategory } from "@/lib/catalog/store-queries"
import { countLabel } from "@/lib/format"

const tints = ["bg-[#eef2f9]", "bg-[#e8f0ff]", "bg-[#f3eee8]", "bg-[#eaf4f1]"]

export function CategoryGrid({ categories }: { categories: NavCategory[] }) {
  if (categories.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeader id="categories" title="تسوّق حسب القسم" />
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((category, i) => (
          <li key={category.id}>
            <Link
              href={`/c/${category.slug}`}
              className={`group hover:shadow-brand-navy/5 flex h-full flex-col-reverse items-center justify-between gap-3 rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:p-6 ${tints[i % tints.length]}`}
            >
              <div className="text-center sm:text-start">
                <h3 className="text-brand-navy text-lg font-bold sm:text-xl">
                  {category.name}
                </h3>
                {category.children.length > 0 && (
                  <p className="text-brand-slate text-sm">
                    {countLabel(category.children.length, {
                      one: "قسم فرعي واحد",
                      two: "قسمان فرعيان",
                      few: "أقسام فرعية",
                      many: "قسم فرعي",
                    })}
                  </p>
                )}
              </div>
              <div className="relative size-24 shrink-0 sm:size-28">
                <Image
                  src={category.image_url ?? "/brand/sheko-icon-512.png"}
                  alt=""
                  fill
                  sizes="112px"
                  className={`object-contain transition group-hover:scale-105 ${category.image_url ? "" : "p-4 opacity-60"}`}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
