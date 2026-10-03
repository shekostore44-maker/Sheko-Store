import type { Metadata } from "next"

import { requireAdmin } from "@/lib/auth/dal"
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/orders/whatsapp"
import { createClient } from "@/lib/supabase/server"

import { SettingsForm } from "./settings-form"

export const metadata: Metadata = { title: "الإعدادات" }

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["whatsapp", "notifications"])

  const value = (key: string) =>
    (data?.find((row) => row.key === key)?.value ?? {}) as Record<string, unknown>
  const whatsapp = value("whatsapp")
  const notifications = value("notifications")

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <h1 className="text-brand-navy text-2xl font-bold sm:text-3xl">الإعدادات</h1>
      <SettingsForm
        whatsapp={{
          number: typeof whatsapp.number === "string" ? whatsapp.number : "",
          template:
            typeof whatsapp.template === "string" && whatsapp.template
              ? whatsapp.template
              : DEFAULT_WHATSAPP_TEMPLATE,
        }}
        sound={notifications.sound !== false}
      />
    </div>
  )
}
