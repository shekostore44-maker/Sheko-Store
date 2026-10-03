import { ChevronDown, Search, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import type { NavCategory } from "@/lib/catalog/store-queries"

import { MobileMenu } from "./mobile-menu"

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <MobileMenu categories={categories} />

        <Link href="/" aria-label="Sheko - الصفحة الرئيسية" className="shrink-0">
          <Image
            src="/brand/sheko-logo.png"
            alt="Sheko"
            width={150}
            height={40}
            priority
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.95rem] font-medium">
            <li>
              <Link
                href="/"
                className="text-brand-navy hover:text-brand-blue transition-colors"
              >
                الرئيسية
              </Link>
            </li>
            {categories.length > 0 && (
              <li className="group relative">
                <Link
                  href="/#categories"
                  className="text-brand-navy hover:text-brand-blue flex items-center gap-1 transition-colors"
                >
                  الأقسام
                  <ChevronDown
                    className="size-4 transition group-hover:rotate-180"
                    aria-hidden
                  />
                </Link>
                {/* Mega menu: opens on hover and on keyboard focus. */}
                <div className="invisible absolute top-full right-1/2 z-50 translate-x-1/2 pt-4 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="border-border shadow-brand-navy/10 grid w-max max-w-[44rem] grid-cols-3 gap-6 rounded-2xl border bg-white p-6 shadow-xl">
                    {categories.map((category) => (
                      <div key={category.id} className="min-w-36">
                        <Link
                          href={`/c/${category.slug}`}
                          className="text-brand-navy hover:text-brand-blue font-bold"
                        >
                          {category.name}
                        </Link>
                        {category.children.length > 0 && (
                          <ul className="mt-2 space-y-1.5">
                            {category.children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/c/${child.slug}`}
                                  className="text-brand-slate hover:text-brand-blue text-sm"
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            )}
            <li>
              <Link
                href="/#new"
                className="text-brand-navy hover:text-brand-blue transition-colors"
              >
                وصل حديثاً
              </Link>
            </li>
            <li>
              <Link
                href="/#offers"
                className="text-brand-navy hover:text-brand-blue transition-colors"
              >
                العروض
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <form action="/search" role="search" className="relative hidden md:block">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <input
              name="q"
              type="search"
              placeholder="ابحث عن منتج…"
              aria-label="ابحث عن منتج"
              className="bg-muted focus-visible:ring-ring/50 h-10 w-48 rounded-full ps-9 pe-4 text-sm outline-none focus-visible:ring-3 lg:w-56"
            />
          </form>
          <Link
            href="/search"
            aria-label="بحث"
            className="text-brand-navy hover:bg-accent rounded-lg p-2 md:hidden"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/cart"
            className="bg-brand-navy text-brand-ice flex items-center gap-2 rounded-full py-1.5 ps-1.5 pe-4 text-sm font-semibold sm:ps-2"
          >
            <span className="bg-brand-cyan text-brand-navy grid size-6 place-items-center rounded-full text-xs font-bold">
              0
            </span>
            <ShoppingBag className="size-4 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">السلة</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
