import { z } from "zod"

import { SLUG_PATTERN } from "@/lib/slug"

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: الحد الأقصى ${max} حرف`)
    .transform((v) => v || null)
    .nullable()
    .optional()
    .transform((v) => v ?? null)

const slug = z
  .string()
  .trim()
  .min(1, "الرابط مطلوب")
  .max(80, "الرابط طويل جداً")
  .regex(SLUG_PATTERN, "الرابط: حروف وأرقام وشَرطات (-) فقط")

const imageUrl = z.url("رابط صورة غير صالح")

const money = (label: string) =>
  z.coerce
    .number({ error: `${label}: اكتب رقماً` })
    .min(0, `${label}: لا يمكن أن يكون سالباً`)
    .max(1_000_000, `${label}: رقم كبير جداً`)

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "اسم القسم: حرفين على الأقل")
    .max(80, "اسم القسم طويل جداً"),
  slug,
  parent_id: z.uuid().nullable(),
  description: optionalText(2000, "الوصف"),
  image_url: imageUrl.nullable(),
  seo_title: optionalText(70, "عنوان SEO"),
  seo_description: optionalText(160, "وصف SEO"),
  is_active: z.boolean(),
})

export type CategoryInput = z.input<typeof categorySchema>

export const productImageSchema = z.object({
  url: imageUrl,
  alt: z.string().trim().min(1, "اكتب وصفاً للصورة (alt)").max(150),
})

export const productVariantSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "اسم المتغير مطلوب").max(80),
  options: z.record(z.string(), z.string()),
  price: money("سعر المتغير").nullable(),
  stock: z.coerce.number().int("المخزون رقم صحيح").min(0, "المخزون لا يكون سالباً"),
  sku: optionalText(64, "كود المتغير"),
  is_active: z.boolean(),
})

export const productSchema = z
  .object({
    id: z.uuid().optional(),
    category_id: z.uuid("اختر القسم"),
    name: z.string().trim().min(2, "اسم المنتج: حرفين على الأقل").max(120),
    slug,
    short_description: optionalText(300, "الوصف المختصر"),
    description: optionalText(20000, "الوصف"),
    price: money("السعر"),
    compare_at_price: money("السعر قبل الخصم").nullable(),
    sku: optionalText(64, "كود المنتج"),
    stock: z.coerce.number().int("المخزون رقم صحيح").min(0, "المخزون لا يكون سالباً"),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    seo_title: optionalText(70, "عنوان SEO"),
    seo_description: optionalText(160, "وصف SEO"),
    images: z.array(productImageSchema).max(12, "الحد الأقصى 12 صورة"),
    variants: z.array(productVariantSchema).max(100, "الحد الأقصى 100 متغير"),
  })
  .refine((p) => p.compare_at_price === null || p.compare_at_price > p.price, {
    path: ["compare_at_price"],
    error: "السعر قبل الخصم لازم يكون أكبر من السعر الحالي",
  })

export type ProductInput = z.input<typeof productSchema>

/** Turns zod issues into { field: firstMessage } for the forms. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_"
    out[key] ??= issue.message
  }
  return out
}
