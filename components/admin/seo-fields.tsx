"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Field } from "./field"

function Counter({ length, max }: { length: number; max: number }) {
  const tone =
    length === 0
      ? "text-muted-foreground"
      : length > max
        ? "text-destructive"
        : "text-success"
  return (
    <span className={tone}>
      {length} / {max}
    </span>
  )
}

/** SEO title/description inputs with a live Google result preview. */
export function SeoFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  fallbackTitle,
  fallbackDescription,
  path,
  errors,
}: {
  title: string
  description: string
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  fallbackTitle: string
  fallbackDescription: string
  path: string
  errors?: Record<string, string>
}) {
  const shownTitle = (title || fallbackTitle || "عنوان الصفحة") + " | Sheko"
  const shownDescription =
    description ||
    fallbackDescription ||
    "اكتب وصفاً مختصراً يظهر تحت العنوان في نتائج جوجل."

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl border border-[#dfe1e5] bg-white p-4"
        aria-label="معاينة نتيجة جوجل"
      >
        <p dir="ltr" className="truncate text-start text-xs text-[#202124]">
          sheko.com › {decodeURIComponent(path).replace(/^\//, "").split("/").join(" › ")}
        </p>
        <p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{shownTitle}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156]">{shownDescription}</p>
      </div>

      <Field
        label="عنوان SEO"
        htmlFor="seo_title"
        error={errors?.seo_title}
        hint={
          <>
            يُفضّل 30–60 حرف. لو سبته فاضي هيتاخد الاسم.{" "}
            <Counter length={title.length} max={60} />
          </>
        }
      >
        <Input
          id="seo_title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={70}
          className="h-10"
        />
      </Field>

      <Field
        label="وصف SEO"
        htmlFor="seo_description"
        error={errors?.seo_description}
        hint={
          <>
            يُفضّل 120–160 حرف. <Counter length={description.length} max={160} />
          </>
        }
      >
        <Textarea
          id="seo_description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={160}
          rows={3}
        />
      </Field>
    </div>
  )
}
