"use client"

import {
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Ticket,
  Truck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Sections are switched to ready as each phase ships.
const nav = [
  { label: "الإحصائيات", href: "/admin", icon: LayoutDashboard, ready: true },
  { label: "الأقسام", href: "/admin/categories", icon: LayoutGrid, ready: true },
  { label: "المنتجات", href: "/admin/products", icon: Package, ready: true },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingCart, ready: false },
  { label: "الشحن", href: "/admin/shipping", icon: Truck, ready: false },
  { label: "العملاء", href: "/admin/customers", icon: Users, ready: false },
  { label: "الكوبونات", href: "/admin/coupons", icon: Ticket, ready: false },
  { label: "البانرات", href: "/admin/banners", icon: ImageIcon, ready: false },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings, ready: false },
] as const

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <nav aria-label="أقسام لوحة التحكم" className="flex flex-col gap-1">
      {nav.map(({ label, href, icon: Icon, ready }) =>
        ready ? (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
              isActive(href)
                ? "bg-sidebar-primary text-brand-ice"
                : "hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ) : (
          <span
            key={href}
            aria-disabled
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-50"
          >
            <Icon className="size-5" aria-hidden />
            {label}
            <span className="bg-sidebar-accent ms-auto rounded-full px-2 py-0.5 text-[0.7rem]">
              قريباً
            </span>
          </span>
        ),
      )}
    </nav>
  )
}
