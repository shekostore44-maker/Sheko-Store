import { LogOut } from "lucide-react"
import type { Metadata } from "next"

import { requireCustomer } from "@/lib/auth/dal"

import { signOutCustomer } from "../(auth)/actions"
import { AccountNav } from "./account-nav"

export const metadata: Metadata = {
  title: { default: "حسابي", template: "%s | حسابي | Sheko" },
  robots: { index: false, follow: false },
}

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const profile = await requireCustomer()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">حسابي</p>
          <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">
            أهلاً{profile.fullName ? `، ${profile.fullName.split(" ")[0]}` : ""} 👋
          </h1>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="text-brand-slate hover:text-destructive flex items-center gap-2 text-sm font-medium"
          >
            <LogOut className="size-4" aria-hidden />
            تسجيل الخروج
          </button>
        </form>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[14rem_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
