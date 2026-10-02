import Image from "next/image"
import Link from "next/link"

import { placeholderCategories } from "@/lib/placeholder-data"

export function CategoryGrid() {
  return (
    <section id="categories" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-brand-navy text-2xl font-bold sm:text-3xl">
          تسوّق حسب القسم
        </h2>
        <Link
          href="/#categories"
          className="text-brand-blue font-semibold hover:underline"
        >
          عرض الكل
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {placeholderCategories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/c/${category.slug}`}
              className={`group hover:shadow-brand-navy/5 flex h-full flex-col-reverse items-center justify-between gap-3 rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:p-6 ${category.tint}`}
            >
              <div className="text-center sm:text-start">
                <h3 className="text-brand-navy text-lg font-bold sm:text-xl">
                  {category.name}
                </h3>
                <p className="text-brand-slate text-sm">{category.count} منتج</p>
              </div>
              <Image
                src={category.image}
                alt=""
                width={120}
                height={120}
                unoptimized
                className="size-24 transition group-hover:scale-105 sm:size-28"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
