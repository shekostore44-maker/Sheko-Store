import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { mainNav } from "@/lib/placeholder-data"

export function SiteHeader() {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <button
          type="button"
          aria-label="القائمة"
          className="text-brand-navy hover:bg-accent rounded-lg p-2 lg:hidden"
        >
          <Menu className="size-6" />
        </button>

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
            {mainNav.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    i === 0
                      ? "text-brand-blue"
                      : "text-brand-navy hover:text-brand-blue transition-colors"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="بحث"
            className="text-brand-navy hover:bg-accent hidden rounded-lg p-2 sm:inline-flex"
          >
            <Search className="size-5" />
          </button>
          <Link
            href="/account"
            aria-label="حسابي"
            className="text-brand-navy hover:bg-accent hidden rounded-lg p-2 sm:inline-flex"
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/wishlist"
            aria-label="المفضلة"
            className="text-brand-navy hover:bg-accent hidden rounded-lg p-2 md:inline-flex"
          >
            <Heart className="size-5" />
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
