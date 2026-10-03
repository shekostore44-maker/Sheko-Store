import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell, GoogleButton } from "@/components/store/auth-ui"
import { getCurrentUser } from "@/lib/auth/dal"

import { safeCustomerNext } from "../actions"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = {
  title: "حساب جديد",
  robots: { index: false, follow: false },
}

export default async function RegisterPage(props: PageProps<"/register">) {
  const next = await safeCustomerNext((await props.searchParams).next)
  if (await getCurrentUser()) redirect(next)

  return (
    <AuthShell title="حساب جديد" subtitle="تابع طلباتك، احفظ عناوينك ومنتجاتك المفضلة">
      <GoogleButton next={next} />
      <RegisterForm next={next} />
      <p className="text-brand-slate text-center text-sm">
        عندك حساب؟{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-brand-blue font-semibold"
        >
          سجّل دخول
        </Link>
      </p>
    </AuthShell>
  )
}
