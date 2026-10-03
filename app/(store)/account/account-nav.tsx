"use client"

import { Heart, MapPin, Package, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { label: "طلباتي", href: "/account", icon: Package },
  { label: "عناويني", href: "/account/addresses", icon: MapPin },
  { label: "المفضلة", href: "/account/wishlist", icon: Heart },
  { label: "بياناتي", href: "/account/profile", icon: UserRound },
] as const

export function AccountNav() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/account"
      ? pathname === "/account" || pathname.startsWith("/account/orders")
      : pathname.startsWith(href)

  return (
    <nav aria-label="أقسام حسابي" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-brand-navy text-brand-ice"
                    : "border-border text-brand-navy hover:bg-brand-ice border bg-white lg:border-transparent lg:bg-transparent"
                }`}
              >
                <Icon className="size-4.5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
