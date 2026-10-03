"use client"

import { ChevronLeft, ImageOff, Menu, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { NavCategory } from "@/lib/catalog/store-queries"

export function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="القائمة"
        className="text-brand-navy hover:bg-accent rounded-lg p-2 lg:hidden"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-0 overflow-y-auto p-0">
        <div className="border-border border-b p-4">
          <SheetTitle className="text-brand-navy text-xl font-bold">القائمة</SheetTitle>
          <form action="/search" role="search" onSubmit={close} className="relative mt-3">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <input
              name="q"
              type="search"
              placeholder="ابحث في Sheko"
              aria-label="ابحث عن منتج"
              className="bg-muted h-11 w-full rounded-xl ps-9 pe-3 text-sm outline-none"
            />
          </form>
        </div>

        <nav aria-label="الأقسام" className="flex flex-col p-2">
          {categories.map((category) => (
            <div key={category.id} className="border-border border-b last:border-0">
              <Link
                href={`/c/${category.slug}`}
                onClick={close}
                className="hover:bg-accent flex items-center gap-3 rounded-xl p-2"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#eef2f9]">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <ImageOff className="text-muted-foreground absolute inset-0 m-auto size-4" />
                  )}
                </span>
                <span className="text-brand-navy flex-1 font-semibold">
                  {category.name}
                </span>
                <ChevronLeft className="text-muted-foreground size-4" aria-hidden />
              </Link>
              {category.children.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-2 ps-16 pe-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/c/${child.slug}`}
                        onClick={close}
                        className="bg-muted text-brand-navy-soft inline-block rounded-full px-3 py-1 text-sm"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">الأقسام هتظهر هنا قريباً.</p>
          )}
        </nav>

        <div className="border-border mt-auto flex flex-col gap-1 border-t p-2">
          <Link
            href="/#new"
            onClick={close}
            className="text-brand-navy hover:bg-accent rounded-xl p-3 font-medium"
          >
            وصل حديثاً
          </Link>
          <Link
            href="/#offers"
            onClick={close}
            className="text-brand-navy hover:bg-accent rounded-xl p-3 font-medium"
          >
            العروض
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
