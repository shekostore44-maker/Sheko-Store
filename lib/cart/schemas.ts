import { z } from "zod"

const EG_MOBILE = /^01[0125]\d{8}$/

/** "+20 ١٠١-٢٣٤٥٦٧٨" → "01012345678": Latin digits, local format, no separators. */
export function normalizePhone(value: string) {
  const digits = value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\d]/g, "")
  if (digits.startsWith("0020")) return "0" + digits.slice(4)
  if (digits.startsWith("20") && digits.length === 12) return "0" + digits.slice(2)
  return digits
}

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: "اكتب اسمك (3 حروف على الأقل)" })
    .max(80, { error: "الاسم طويل جداً" }),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(
      z.string().regex(EG_MOBILE, {
        error: "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015",
      }),
    ),
  governorateId: z.coerce.number().int().positive({ error: "اختار المحافظة" }),
  cityId: z.coerce.number().int().positive({ error: "اختار المدينة أو المركز" }),
  address: z
    .string()
    .trim()
    .min(8, { error: "اكتب العنوان بالتفصيل (الشارع، رقم العمارة، علامة مميزة)" })
    .max(300, { error: "العنوان طويل جداً" }),
  notes: z.string().trim().max(500, { error: "الملاحظات طويلة جداً" }).default(""),
})
export type CheckoutInput = z.input<typeof checkoutSchema>

export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.uuid(),
      variantId: z.uuid().nullable(),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .min(1, { error: "السلة فاضية" })
  .max(50)
export type CartLine = z.infer<typeof cartLinesSchema>[number]
