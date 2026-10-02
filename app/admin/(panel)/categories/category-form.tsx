"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Field, NativeSelect } from "@/components/admin/field"
import { ImageField } from "@/components/admin/image-field"
import { SeoFields } from "@/components/admin/seo-fields"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Category } from "@/lib/catalog/types"
import { slugify } from "@/lib/slug"

import { saveCategory } from "./actions"

export function CategoryForm({
  category,
  parents,
}: {
  category?: Category
  parents: Category[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState(category?.name ?? "")
  const [slug, setSlug] = useState(category ? decodeURIComponent(category.slug) : "")
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const [parentId, setParentId] = useState(category?.parent_id ?? "")
  const [description, setDescription] = useState(category?.description ?? "")
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? null)
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [seoTitle, setSeoTitle] = useState(category?.seo_title ?? "")
  const [seoDescription, setSeoDescription] = useState(category?.seo_description ?? "")

  const parentOptions = parents.filter((p) => p.id !== category?.id)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveCategory({
        id: category?.id,
        name,
        slug,
        parent_id: parentId || null,
        description,
        image_url: imageUrl,
        seo_title: seoTitle,
        seo_description: seoDescription,
        is_active: isActive,
      })

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      toast.success(category ? "اتحفظت التعديلات" : `اتضاف قسم «${name}»`)
      router.push("/admin/categories", { scroll: false })
      if (!category) {
        // Clear the form for the next category.
        setName("")
        setSlug("")
        setSlugTouched(false)
        setDescription("")
        setImageUrl(null)
        setSeoTitle("")
        setSeoDescription("")
        setErrors({})
      }
    })
  }

  return (
    <form
      onSubmit={submit}
      className="border-brand-blue/40 flex flex-col gap-4 rounded-2xl border-2 bg-white p-5 xl:sticky xl:top-22"
    >
      <h2 className="text-brand-navy text-xl font-bold">
        {category ? `تعديل «${category.name}»` : "إضافة قسم جديد"}
      </h2>

      <Field label="اسم القسم" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
          placeholder="مثال: الساعات"
          aria-invalid={Boolean(errors.name)}
          className="h-10"
          required
        />
      </Field>

      <Field
        label="الرابط (Slug)"
        htmlFor="slug"
        error={errors.slug}
        hint={`هيظهر كده: sheko.com/c/${slug || "…"}`}
      >
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          onBlur={() => setSlug(slugify(slug))}
          aria-invalid={Boolean(errors.slug)}
          className="h-10"
          required
        />
      </Field>

      <Field
        label="القسم الأب"
        htmlFor="parent"
        error={errors.parent_id}
        hint="اختار قسم رئيسي لو ده قسم فرعي"
      >
        <NativeSelect
          id="parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— قسم رئيسي —</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="صورة القسم" error={errors.image_url}>
        <ImageField value={imageUrl} onChange={setImageUrl} folder="categories" />
      </Field>

      <Field
        label="وصف القسم"
        htmlFor="description"
        error={errors.description}
        hint="نص قصير يظهر في صفحة القسم ويساعد في جوجل"
      >
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Field>

      <details className="border-border rounded-xl border p-3">
        <summary className="text-brand-navy cursor-pointer font-semibold">
          إعدادات جوجل (SEO)
        </summary>
        <div className="mt-4">
          <SeoFields
            title={seoTitle}
            description={seoDescription}
            onTitleChange={setSeoTitle}
            onDescriptionChange={setSeoDescription}
            fallbackTitle={name}
            fallbackDescription={description}
            path={`/c/${slug}`}
            errors={errors}
          />
        </div>
      </details>

      <label className="flex items-center justify-between gap-3">
        <span className="text-brand-navy font-medium">ظاهر في المتجر</span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-blue h-11 flex-1 rounded-xl font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "جاري الحفظ…" : category ? "حفظ التعديلات" : "إضافة القسم"}
        </button>
        {category && (
          <Link
            href="/admin/categories"
            scroll={false}
            className="border-border text-brand-navy flex h-11 items-center rounded-xl border px-4 font-semibold"
          >
            إلغاء
          </Link>
        )}
      </div>
    </form>
  )
}
