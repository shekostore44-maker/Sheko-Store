import { LogOut } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"

import { Toaster } from "@/components/ui/sonner"
import { getAdmin } from "@/lib/auth/dal"

import { signOut } from "../actions"
import { AdminNav } from "./admin-nav"
import { MobileNav } from "./mobile-nav"

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم Sheko" },
  robots: { index: false, follow: false },
}

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  // Display only; every admin page and action calls requireAdmin() itself.
  const admin = await getAdmin()

  return (
    <div className="bg-brand-ice flex min-h-screen flex-1">
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/brand/sheko-icon-512.png" alt="" width={44} height={44} />
          <span className="font-heading text-brand-ice text-xl font-bold">Sheko</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>
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
        <header className="border-border sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <p className="text-brand-navy font-semibold">
              أهلاً{admin?.fullName ? `، ${admin.fullName}` : ""}
            </p>
          </div>
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
      <Toaster position="top-center" richColors dir="rtl" />
    </div>
  )
}
