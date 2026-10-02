import {
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Ticket,
  Truck,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { getAdmin } from "@/lib/auth/dal"

import { signOut } from "../actions"

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم Sheko" },
  robots: { index: false, follow: false },
}

// Sections are enabled as each phase ships.
const nav = [
  { label: "الإحصائيات", href: "/admin", icon: LayoutDashboard, ready: true },
  { label: "الأقسام", href: "/admin/categories", icon: LayoutGrid, ready: false },
  { label: "المنتجات", href: "/admin/products", icon: Package, ready: false },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingCart, ready: false },
  { label: "الشحن", href: "/admin/shipping", icon: Truck, ready: false },
  { label: "العملاء", href: "/admin/customers", icon: Users, ready: false },
  { label: "الكوبونات", href: "/admin/coupons", icon: Ticket, ready: false },
  { label: "البانرات", href: "/admin/banners", icon: ImageIcon, ready: false },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings, ready: false },
] as const

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  // Display only; every admin page calls requireAdmin() itself.
  const admin = await getAdmin()

  return (
    <div className="bg-brand-ice flex min-h-screen flex-1">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/brand/sheko-icon-512.png" alt="" width={44} height={44} />
          <span className="font-heading text-brand-ice text-xl font-bold">Sheko</span>
        </div>
        <nav aria-label="أقسام لوحة التحكم" className="flex flex-1 flex-col gap-1">
          {nav.map(({ label, href, icon: Icon, ready }, i) =>
            ready ? (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
                  i === 0
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
        <form action={signOut}>
          <button
            type="submit"
            className="hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition"
          >
            <LogOut className="size-5" aria-hidden />
            تسجيل الخروج
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
          <p className="text-brand-navy font-semibold">
            أهلاً{admin?.fullName ? `، ${admin.fullName}` : ""}
          </p>
          <div className="flex items-center gap-3">
            <span dir="ltr" className="text-muted-foreground hidden text-sm sm:inline">
              {admin?.email}
            </span>
            <form action={signOut} className="lg:hidden">
              <button type="submit" className="text-brand-navy text-sm font-semibold">
                خروج
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
