"use client"

import { ImagePlus, Loader2, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { uploadImage } from "@/lib/storage/upload"

/** Single image picker that uploads to Supabase Storage and returns the public URL. */
export function ImageField({
  value,
  onChange,
  folder,
  label = "اسحب الصورة هنا أو اضغط للاختيار",
}: {
  value: string | null
  onChange: (url: string | null) => void
  folder: "categories" | "banners"
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className="border-border relative h-36 overflow-hidden rounded-xl border bg-[#eef2f9]">
        <Image src={value} alt="" fill sizes="320px" className="object-contain p-2" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="حذف الصورة"
          className="bg-brand-navy/80 hover:bg-brand-navy absolute top-2 left-2 rounded-full p-1.5 text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
      }}
      disabled={uploading}
      className={`flex h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition ${
        dragOver
          ? "border-brand-blue bg-brand-tint"
          : "border-brand-blue/40 bg-brand-tint/40 hover:bg-brand-tint"
      }`}
    >
      {uploading ? (
        <Loader2 className="text-brand-blue size-7 animate-spin" />
      ) : (
        <ImagePlus className="text-brand-blue size-7" />
      )}
      <span className="text-brand-navy-soft">{uploading ? "جاري الرفع…" : label}</span>
      <span className="text-muted-foreground text-xs">
        JPG أو PNG أو WebP — حتى 5 ميجا
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </button>
  )
}
