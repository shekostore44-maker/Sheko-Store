"use client"

import { Banknote, Loader2, MapPin, ShoppingBag, UserRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { CartNotices } from "@/components/store/cart-notices"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCheckoutDefaults,
  placeOrder,
  type CheckoutDefaults,
} from "@/lib/cart/actions"
import type { ShippingGovernorate } from "@/lib/cart/queries"
import {
  cartCount,
  cartKey,
  cartSubtotal,
  clearCart,
  useCart,
  useHydrated,
} from "@/lib/cart/store"
import { useCartRefresh } from "@/lib/cart/use-cart-refresh"
import { formatNumber, formatPrice, pieceCount } from "@/lib/format"

type Form = {
  name: string
  phone: string
  governorateId: string
  cityId: string
  address: string
  notes: string
}
const EMPTY_FORM: Form = {
  name: "",
  phone: "",
  governorateId: "",
  cityId: "",
  address: "",
  notes: "",
}

const inputClass =
  "border-border focus-visible:border-brand-blue focus-visible:ring-ring/30 aria-invalid:border-destructive h-12 w-full rounded-xl border bg-white px-4 text-base outline-none focus-visible:ring-4 disabled:bg-muted"

function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-brand-navy text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  )
}

export function CheckoutForm({ governorates }: { governorates: ShippingGovernorate[] }) {
  const hydrated = useHydrated()
  const items = useCart()
  const { notices, refresh } = useCartRefresh()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [website, setWebsite] = useState("")
  const [placed, setPlaced] = useState(false)
  const [account, setAccount] = useState<CheckoutDefaults | null>(null)
  const [saveAddress, setSaveAddress] = useState(true)

  // Signed-in customers: prefill name, phone and their default address.
  useEffect(() => {
    let cancelled = false
    getCheckoutDefaults()
      .then((defaults) => {
        if (cancelled) return
        setAccount(defaults)
        if (!defaults.signedIn) return
        const saved = defaults.addresses.find((a) =>
          governorates.some((g) => g.id === a.governorateId),
        )
        setForm((f) => ({
          ...f,
          name: f.name || defaults.name,
          phone: f.phone || saved?.phone || defaults.phone,
          ...(saved && !f.governorateId
            ? {
                governorateId: String(saved.governorateId),
                cityId: saved.cityId ? String(saved.cityId) : "",
                address: saved.address,
              }
            : {}),
        }))
        if (saved) setSaveAddress(false)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [governorates])

  function applyAddress(a: CheckoutDefaults["addresses"][number]) {
    setForm((f) => ({
      ...f,
      governorateId: String(a.governorateId),
      cityId: a.cityId ? String(a.cityId) : "",
      address: a.address,
      phone: a.phone || f.phone,
    }))
    setErrors({})
    setSaveAddress(false)
  }
  const usableAddresses =
    account?.addresses.filter((a) =>
      governorates.some((g) => g.id === a.governorateId),
    ) ?? []

  const governorate = governorates.find((g) => String(g.id) === form.governorateId)
  const subtotal = cartSubtotal(items)
  const shipping = governorate?.fee ?? 0

  const set =
    (field: keyof Form) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const value = event.target.value
      setForm((f) => ({
        ...f,
        [field]: value,
        ...(field === "governorateId" ? { cityId: "" } : {}),
      }))
      setErrors((e) => ({ ...e, [field]: "" }))
    }
  const invalid = (field: keyof Form) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {}

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await placeOrder({
        customer: form,
        items: items.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
        website,
        saveAddress: account?.signedIn ? saveAddress : false,
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        if (result.refreshCart) void refresh()
        const first = Object.keys(result.fieldErrors ?? {})[0]
        if (first) document.getElementById(first)?.focus()
        return
      }
      setPlaced(true)
      clearCart()
      router.replace(`/order/${result.data.orderNumber}?t=${result.data.token}&new=1`)
    })
  }

  if (!hydrated || placed) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Skeleton className="h-[30rem] rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <CartNotices notices={notices} />
        <div className="border-border flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
          <ShoppingBag className="text-brand-blue size-10" aria-hidden />
          <p className="text-brand-navy text-lg font-bold">سلتك فاضية</p>
          <Link
            href="/"
            className="bg-brand-navy text-brand-ice rounded-xl px-6 py-3 font-semibold"
          >
            ابدأ التسوق
          </Link>
        </div>
      </div>
    )
  }

  if (!governorates.length) {
    return (
      <p className="border-border text-brand-slate mt-6 rounded-2xl border bg-white p-6">
        الطلب أونلاين مش متاح دلوقتي. جرّب تاني بعد شوية.
      </p>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_24rem]"
    >
      <div className="flex flex-col gap-6">
        <CartNotices notices={notices} />

        {account && !account.signedIn && (
          <p className="bg-brand-ice text-brand-navy flex flex-wrap items-center gap-2 rounded-2xl p-4 text-sm">
            <UserRound className="text-brand-blue size-5" aria-hidden />
            عندك حساب؟
            <Link href="/login?next=/checkout" className="text-brand-blue font-semibold">
              سجّل دخول
            </Link>
            عشان نملا بياناتك وتتابع طلبك من حسابك. أو كمّل كضيف عادي.
          </p>
        )}

        <section className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="text-brand-navy text-lg font-bold">بيانات التواصل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="name" label="الاسم بالكامل" error={errors.name}>
              <input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                maxLength={80}
                required
                className={inputClass}
                {...invalid("name")}
              />
            </FormField>
            <FormField
              id="phone"
              label="رقم الموبايل"
              error={errors.phone}
              hint="هنتواصل معاك عليه لتأكيد الطلب"
            >
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={set("phone")}
                maxLength={20}
                required
                className={`${inputClass} text-end`}
                {...invalid("phone")}
              />
            </FormField>
          </div>
        </section>

        <section className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="text-brand-navy text-lg font-bold">عنوان التوصيل</h2>
          {usableAddresses.length > 1 && (
            <div className="flex flex-wrap gap-2" aria-label="عناويني المحفوظة">
              {usableAddresses.map((a) => {
                const selected =
                  form.governorateId === String(a.governorateId) &&
                  form.address === a.address
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAddress(a)}
                    aria-pressed={selected}
                    className={`flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${selected ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-semibold" : "border-border text-brand-navy bg-white"}`}
                  >
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">
                      {governorates.find((g) => g.id === a.governorateId)?.name} —{" "}
                      {a.address}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="governorateId"
              label="المحافظة"
              error={errors.governorateId}
              hint={
                governorate
                  ? `التوصيل خلال ${formatNumber(governorate.minDays)}${governorate.maxDays > governorate.minDays ? `–${formatNumber(governorate.maxDays)}` : ""} يوم عمل`
                  : undefined
              }
            >
              <select
                id="governorateId"
                value={form.governorateId}
                onChange={set("governorateId")}
                required
                className={inputClass}
                {...invalid("governorateId")}
              >
                <option value="">اختار المحافظة</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — شحن {g.fee ? formatPrice(g.fee) : "مجاني"}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="cityId" label="المدينة / المركز" error={errors.cityId}>
              <select
                id="cityId"
                value={form.cityId}
                onChange={set("cityId")}
                disabled={!governorate}
                required
                className={inputClass}
                {...invalid("cityId")}
              >
                <option value="">
                  {governorate ? "اختار المدينة أو المركز" : "اختار المحافظة الأول"}
                </option>
                {governorate?.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField
            id="address"
            label="العنوان بالتفصيل"
            error={errors.address}
            hint="اسم الشارع، رقم العمارة والدور والشقة، وعلامة مميزة قريبة"
          >
            <textarea
              id="address"
              autoComplete="street-address"
              rows={3}
              value={form.address}
              onChange={set("address")}
              maxLength={300}
              required
              className={`${inputClass} h-auto py-3`}
              {...invalid("address")}
            />
          </FormField>
          <FormField id="notes" label="ملاحظات (اختياري)" error={errors.notes}>
            <textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={set("notes")}
              maxLength={500}
              placeholder="مثلاً: اتصل قبل ما توصل"
              className={`${inputClass} h-auto py-3`}
            />
          </FormField>
          {account?.signedIn && (
            <label className="text-brand-navy flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="accent-brand-blue size-4"
              />
              احفظ العنوان ده في حسابي
            </label>
          )}
          {/* Honeypot: invisible to people, bots fill it in. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </section>

        <section className="border-brand-blue bg-brand-ice flex items-center gap-3 rounded-2xl border-2 p-4">
          <Banknote className="text-brand-blue size-6 shrink-0" aria-hidden />
          <div>
            <p className="text-brand-navy font-bold">الدفع كاش عند الاستلام</p>
            <p className="text-brand-slate text-sm">تدفع لمندوب الشحن لما الطلب يوصلك.</p>
          </div>
        </section>
      </div>

      <aside className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-brand-navy text-lg font-bold">
          طلبك ({pieceCount(cartCount(items))})
        </h2>
        <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto">
          {items.map((item) => (
            <li key={cartKey(item)} className="flex items-center gap-3">
              <span className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
                {item.image && (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
                <span className="bg-brand-navy absolute end-0 top-0 grid min-w-5 place-items-center rounded-bl-lg px-1 text-xs font-bold text-white">
                  {item.quantity}
                </span>
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-brand-navy line-clamp-1 font-semibold">{item.name}</p>
                {item.variantName && (
                  <p className="text-muted-foreground">{item.variantName}</p>
                )}
              </div>
              <p className="text-brand-navy shrink-0 text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="border-border flex flex-col gap-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-slate">المجموع</dt>
            <dd className="text-brand-navy font-semibold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-slate">
              الشحن{governorate ? ` (${governorate.name})` : ""}
            </dt>
            <dd className="text-brand-navy font-semibold">
              {governorate
                ? shipping
                  ? formatPrice(shipping)
                  : "مجاني"
                : "اختار المحافظة"}
            </dd>
          </div>
        </dl>
        <div className="border-border flex justify-between border-t pt-3">
          <span className="text-brand-navy font-bold">الإجمالي</span>
          <span className="text-brand-navy text-xl font-bold">
            {formatPrice(subtotal + shipping)}
          </span>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-navy text-brand-ice flex h-13 items-center justify-center gap-2 rounded-xl text-lg font-bold disabled:opacity-70"
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {pending ? "بنسجّل طلبك…" : "تأكيد الطلب"}
        </button>
        <p className="text-muted-foreground text-center text-xs">
          بعد التأكيد هيفتحلك واتساب برسالة فيها تفاصيل طلبك عشان تبعتها لنا.
        </p>
      </aside>
    </form>
  )
}
