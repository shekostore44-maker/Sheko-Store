"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/dal"
import { catalogDbError } from "@/lib/catalog/revalidate"
import type { ActionResult } from "@/lib/catalog/types"
import { toWhatsappNumber } from "@/lib/orders/whatsapp"
import { createClient } from "@/lib/supabase/server"

const whatsappSchema = z.object({
  number: z.string().trim().max(30),
  template: z
    .string()
    .trim()
    .min(10, { error: "القالب قصير جداً" })
    .max(3000, { error: "القالب طويل جداً" }),
})

export async function saveWhatsappSettings(
  input: z.input<typeof whatsappSchema>,
): Promise<ActionResult<{ number: string | null }>> {
  await requireAdmin()
  const parsed = whatsappSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "راجع البيانات" }
  }
  const number = parsed.data.number ? toWhatsappNumber(parsed.data.number) : null
  if (parsed.data.number && !number) {
    return {
      ok: false,
      error: "رقم الواتساب مش صحيح",
      fieldErrors: { number: "اكتب الرقم كامل، مثلاً 01012345678 أو 201012345678" },
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("settings")
    .upsert({
      key: "whatsapp",
      value: { number, template: parsed.data.template },
      is_public: false,
    })
  if (error) return { ok: false, error: catalogDbError(error) }
  // Order pages read this on every request; nothing cached to refresh.
  return { ok: true, data: { number } }
}

export async function saveNotificationSettings(input: {
  sound: boolean
}): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("settings").upsert({
    key: "notifications",
    value: { sound: input.sound === true },
    is_public: false,
  })
  if (error) return { ok: false, error: catalogDbError(error) }
  revalidatePath("/admin", "layout")
  return { ok: true }
}
