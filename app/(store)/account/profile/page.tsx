import type { Metadata } from "next"

import { requireCustomer } from "@/lib/auth/dal"

import { PasswordForm } from "../../(auth)/reset-password/password-form"
import { ProfileForm } from "./profile-form"

export const metadata: Metadata = { title: "بياناتي" }

export default async function ProfilePage() {
  const profile = await requireCustomer("/account/profile")

  return (
    <div className="flex flex-col gap-6">
      <section className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-brand-navy text-xl font-bold">بياناتي</h2>
        <p className="text-muted-foreground text-sm">
          البريد الإلكتروني:{" "}
          <span dir="ltr" className="text-brand-navy font-semibold">
            {profile.email}
          </span>
        </p>
        <ProfileForm fullName={profile.fullName} phone={profile.phone} />
      </section>
      <section className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-brand-navy text-xl font-bold">تغيير كلمة المرور</h2>
        <PasswordForm submitLabel="تغيير كلمة المرور" />
      </section>
    </div>
  )
}
