"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Field, NativeSelect, Section } from "@/components/admin/field"
import { ImageManager, type ManagedImage } from "@/components/admin/image-manager"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { SeoFields } from "@/components/admin/seo-fields"
import {
  groupsFromVariants,
  VariantsEditor,
  type EditableVariant,
  type OptionGroup,
} from "@/components/admin/variants-editor"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { CategoryOption } from "@/lib/catalog/admin-queries"
import type { ProductWithRelations } from "@/lib/catalog/types"
import { slugify } from "@/lib/slug"

import { saveProduct } from "./actions"

const numberText = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n)
// Accept Arabic-Indic digits typed on Arabic keyboards.
const toNumber = (text: string) =>
  text.trim() === ""
    ? null
    : Number(
        text
          .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
          .replace(/[,،]/g, ""),
      )

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductWithRelations
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product ? decodeURIComponent(product.slug) : "")
  const [slugTouched, setSlugTouched] = useState(Boolean(product))
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "")
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? "",
  )
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(numberText(product?.price))
  const [compareAtPrice, setCompareAtPrice] = useState(
    numberText(product?.compare_at_price),
  )
  const [sku, setSku] = useState(product?.sku ?? "")
  const [stock, setStock] = useState(numberText(product?.stock ?? 0))
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? "")
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "")
  const [images, setImages] = useState<ManagedImage[]>(
    (product?.images ?? []).map((img) => ({
      key: crypto.randomUUID(),
      url: img.url,
      alt: img.alt,
    })),
  )
  const [groups, setGroups] = useState<OptionGroup[]>(
    groupsFromVariants(product?.variants ?? []),
  )
  const [variants, setVariants] = useState<EditableVariant[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      options: v.options,
      price: numberText(v.price),
      stock: numberText(v.stock),
      sku: v.sku ?? "",
      is_active: v.is_active,
    })),
  )

  const hasVariants = variants.length > 0
  const variantsStock = variants
    .filter((v) => v.is_active)
    .reduce((s, v) => s + (toNumber(v.stock) ?? 0), 0)
  const discount =
    toNumber(compareAtPrice) && toNumber(price)
      ? Math.round((1 - toNumber(price)! / toNumber(compareAtPrice)!) * 100)
      : 0

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (images.some((img) => img.uploading)) {
      toast.warning("استنى لحد ما الصور تخلص رفع")
      return
    }

    startTransition(async () => {
      const result = await saveProduct({
        id: product?.id,
        name,
        slug,
        category_id: categoryId,
        short_description: shortDescription,
        description,
        price: toNumber(price) ?? Number.NaN,
        compare_at_price: toNumber(compareAtPrice),
        sku,
        stock: hasVariants ? variantsStock : (toNumber(stock) ?? 0),
        is_active: isActive,
        is_featured: isFeatured,
        seo_title: seoTitle,
        seo_description: seoDescription,
        images: images.map((img) => ({ url: img.url, alt: img.alt.trim() || name })),
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          options: v.options,
          price: toNumber(v.price),
          stock: toNumber(v.stock) ?? 0,
          sku: v.sku,
          is_active: v.is_active,
        })),
      })

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      setErrors({})
      toast.success(product ? "اتحفظت التعديلات" : "اتضاف المنتج")
      if (product) router.refresh()
      else router.replace(`/admin/products/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="bg-brand-ice/95 sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/admin/products"
            aria-label="رجوع للمنتجات"
            className="text-brand-navy hover:bg-accent rounded-lg p-1.5"
          >
            <ArrowRight className="size-5" />
          </Link>
          <h1 className="text-brand-navy truncate text-xl font-bold sm:text-2xl">
            {product ? product.name : "منتج جديد"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-brand-blue h-10 rounded-xl px-6 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "جاري الحفظ…" : product ? "حفظ التعديلات" : "حفظ المنتج"}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="المعلومات الأساسية">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم المنتج" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slugTouched) setSlug(slugify(e.target.value))
                  }}
                  placeholder="مثال: ساعة كلاسيك بسوار جلد"
                  aria-invalid={Boolean(errors.name)}
                  className="h-10"
                  required
                />
              </Field>
              <Field label="القسم" htmlFor="category" error={errors.category_id}>
                <NativeSelect
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  aria-invalid={Boolean(errors.category_id)}
                  required
                >
                  <option value="">— اختر القسم —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {categories.length === 0 && (
              <p className="text-destructive text-sm">
                لازم تضيف قسم الأول من{" "}
                <Link href="/admin/categories" className="underline">
                  صفحة الأقسام
                </Link>
                .
              </p>
            )}
            <Field
              label="الرابط (Slug)"
              htmlFor="slug"
              error={errors.slug}
              hint={`هيظهر كده: sheko.com/p/${slug || "…"}`}
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
              label="وصف مختصر"
              htmlFor="short"
              error={errors.short_description}
              hint="سطر أو سطرين يظهروا جنب السعر وفي نتائج البحث"
            >
              <Textarea
                id="short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                maxLength={300}
              />
            </Field>
            <Field label="الوصف الكامل" htmlFor="description" error={errors.description}>
              <RichTextEditor
                id="description"
                value={description}
                onChange={setDescription}
              />
            </Field>
          </Section>

          <Section
            title="الصور"
            description="أول صورة هي اللي بتظهر في المتجر ونتائج جوجل."
          >
            <ImageManager images={images} onChange={setImages} defaultAlt={name} />
            {errors.images && <p className="text-destructive text-sm">{errors.images}</p>}
          </Section>

          <Section
            title="المتغيرات"
            description="لو المنتج له ألوان أو مقاسات مختلفة. لو مالوش، سيب الجزء ده فاضي."
          >
            <VariantsEditor
              groups={groups}
              onGroupsChange={setGroups}
              variants={variants}
              onVariantsChange={setVariants}
              basePrice={price}
              errors={errors}
            />
          </Section>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-36">
          <Section title="الحالة">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="text-brand-navy block font-medium">
                  {isActive ? "منشور" : "مسودة"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {isActive ? "ظاهر للعملاء في المتجر" : "مخفي عن العملاء"}
                </span>
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="text-brand-navy block font-medium">منتج مميز</span>
                <span className="text-muted-foreground text-xs">
                  يظهر في الصفحة الرئيسية
                </span>
              </span>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </label>
          </Section>

          <Section title="السعر والمخزون">
            <div className="grid grid-cols-2 gap-3">
              <Field label="السعر (ج.م)" htmlFor="price" error={errors.price}>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={Boolean(errors.price)}
                  className="h-10"
                  required
                />
              </Field>
              <Field
                label="قبل الخصم"
                htmlFor="compare"
                error={errors.compare_at_price}
                hint={discount > 0 ? `خصم ${discount}%` : "اختياري"}
              >
                <Input
                  id="compare"
                  inputMode="decimal"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  aria-invalid={Boolean(errors.compare_at_price)}
                  className="h-10"
                />
              </Field>
              <Field label="الكود (SKU)" htmlFor="sku" error={errors.sku} hint="اختياري">
                <Input
                  id="sku"
                  dir="ltr"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  aria-invalid={Boolean(errors.sku)}
                  className="h-10"
                />
              </Field>
              <Field
                label="المخزون"
                htmlFor="stock"
                error={errors.stock}
                hint={hasVariants ? "محسوب من المتغيرات" : undefined}
              >
                <Input
                  id="stock"
                  inputMode="numeric"
                  value={hasVariants ? String(variantsStock) : stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={hasVariants}
                  aria-invalid={Boolean(errors.stock)}
                  className="h-10"
                />
              </Field>
            </div>
          </Section>

          <Section title="جوجل (SEO)">
            <SeoFields
              title={seoTitle}
              description={seoDescription}
              onTitleChange={setSeoTitle}
              onDescriptionChange={setSeoDescription}
              fallbackTitle={name}
              fallbackDescription={shortDescription}
              path={`/p/${slug}`}
              errors={errors}
            />
          </Section>
        </div>
      </div>
    </form>
  )
}
