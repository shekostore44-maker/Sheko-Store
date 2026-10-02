"use client"

import { createClient } from "@/lib/supabase/client"

export const MEDIA_BUCKET = "media"
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/** Checks a file before upload; returns an Arabic error message or null. */
export function imageFileError(file: File): string | null {
  if (!ALLOWED.includes(file.type))
    return `«${file.name}»: الصيغ المسموحة JPG و PNG و WebP و AVIF`
  if (file.size > MAX_BYTES) return `«${file.name}»: الحجم أكبر من 5 ميجا`
  return null
}

/**
 * Uploads an image straight from the admin's browser to Supabase Storage.
 * Storage RLS only lets admins write to the bucket.
 */
export async function uploadImage(
  file: File,
  folder: "products" | "categories" | "banners",
) {
  const problem = imageFileError(file)
  if (problem) throw new Error(problem)

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "31536000", contentType: file.type })
  if (error) throw new Error(`فشل رفع «${file.name}»: ${error.message}`)

  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}
