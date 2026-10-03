import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/store/auth-ui"

import { ForgotForm } from "./forgot-form"

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      subtitle="اكتب بريدك وهنبعتلك لينك تعمل بيه كلمة مرور جديدة"
    >
      <ForgotForm />
      <Link href="/login" className="text-brand-blue text-center text-sm font-semibold">
        ← رجوع لتسجيل الدخول
      </Link>
    </AuthShell>
  )
}
