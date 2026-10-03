import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/store/auth-ui"
import { getCurrentUser } from "@/lib/auth/dal"

import { PasswordForm } from "./password-form"

export const metadata: Metadata = {
  title: "كلمة مرور جديدة",
  robots: { index: false, follow: false },
}

/** Reached from the reset email (/auth/confirm signs the visitor in first). */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser()

  return (
    <AuthShell title="كلمة مرور جديدة">
      {user ? (
        <PasswordForm submitLabel="حفظ كلمة المرور" />
      ) : (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-brand-slate">
            اللينك انتهى أو اتستخدم قبل كده. اطلب لينك جديد وافتحه من نفس الجهاز.
          </p>
          <Link
            href="/forgot-password"
            className="bg-brand-navy text-brand-ice rounded-xl py-3 font-bold"
          >
            اطلب لينك جديد
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
