import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"

import { getAdmin } from "@/lib/auth/dal"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "دخول لوحة التحكم",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  // Already signed in as admin: go straight to the dashboard.
  if (await getAdmin()) redirect("/admin")

  const { next, error } = await props.searchParams
  const initialError =
    error === "forbidden" ? "هذا الحساب ليس له صلاحية الدخول للوحة التحكم" : undefined

  return (
    <main className="bg-brand-ice flex flex-1 items-center justify-center px-4 py-12">
      <div className="border-border shadow-brand-navy/5 w-full max-w-sm rounded-3xl border bg-white p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/brand/sheko-icon-512.png" alt="" width={72} height={72} priority />
          <h1 className="text-brand-navy text-2xl font-bold">لوحة تحكم Sheko</h1>
          <p className="text-muted-foreground text-sm">سجّل دخولك بحساب الأدمن</p>
        </div>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          initialError={initialError}
        />
      </div>
    </main>
  )
}
