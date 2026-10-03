"use client"

import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { label: "الرئيسية", href: "/", icon: Home, match: (p: string) => p === "/" },
  {
    label: "الأقسام",
    href: "/#categories",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/c/"),
  },
  {
    label: "البحث",
    href: "/search",
    icon: Search,
    match: (p: string) => p.startsWith("/search"),
  },
  {
    label: "السلة",
    href: "/cart",
    icon: ShoppingBag,
    match: (p: string) => p.startsWith("/cart"),
  },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="التنقل السريع"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {items.map(({ label, href, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? "text-brand-blue" : "text-[#8a97b5]"
                }`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
