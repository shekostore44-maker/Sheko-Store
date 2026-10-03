import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell, GoogleButton } from "@/components/store/auth-ui"
import { getCurrentUser } from "@/lib/auth/dal"

import { safeCustomerNext } from "../actions"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  robots: { index: false, follow: false },
}

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams
  const next = await safeCustomerNext(sp.next)
  if (await getCurrentUser()) redirect(next)

  const fromCheckout = next.startsWith("/checkout")
  const linkError =
    sp.error === "link"
      ? "اللينك ده انتهى أو اتستخدم قبل كده. سجّل دخول، أو اطلب لينك جديد."
      : undefined

  return (
    <AuthShell title="تسجيل الدخول" subtitle="أهلاً بيك تاني في Sheko">
      <GoogleButton next={next} />
      <LoginForm next={next} initialError={linkError} />
      <div className="text-brand-slate flex flex-col items-center gap-2 text-sm">
        <p>
          معندكش حساب؟{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="text-brand-blue font-semibold"
          >
            سجّل دلوقتي
          </Link>
        </p>
        {fromCheckout && (
          <Link
            href="/checkout"
            className="border-border text-brand-navy mt-2 w-full rounded-xl border py-3 text-center font-semibold"
          >
            أكمل الطلب كضيف من غير حساب
          </Link>
        )}
      </div>
    </AuthShell>
  )
}
