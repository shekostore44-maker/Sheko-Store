"use client"

import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { AuthField, SubmitButton } from "@/components/store/auth-ui"
import type { ShippingGovernorate } from "@/lib/cart/queries"

import { deleteAddress, saveAddress, setDefaultAddress } from "../actions"

export type SavedAddress = {
  id: string
  governorate_id: number
  city_id: number | null
  address: string
  phone: string
  is_default: boolean
}

const selectClass =
  "border-border focus-visible:border-brand-blue focus-visible:ring-ring/30 aria-invalid:border-destructive h-12 w-full rounded-xl border bg-white px-4 text-base outline-none focus-visible:ring-4 disabled:bg-muted"

export function AddressBook({
  addresses,
  governorates,
  defaultPhone,
}: {
  addresses: SavedAddress[]
  governorates: ShippingGovernorate[]
  defaultPhone: string
}) {
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(
    addresses.length ? null : "new",
  )
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const describe = (a: SavedAddress) => {
    const gov = governorates.find((g) => g.id === a.governorate_id)
    const city = gov?.cities.find((c) => c.id === a.city_id)
    return { gov, place: [gov?.name, city?.name].filter(Boolean).join(" – ") }
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return void toast.error(result.error)
      toast.success(success)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => {
            const { gov, place } = describe(a)
            return (
              <li
                key={a.id}
                className={`flex flex-col gap-2 rounded-2xl border bg-white p-4 ${a.is_default ? "border-brand-blue" : "border-border"}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin
                    className="text-brand-blue mt-0.5 size-5 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-navy font-semibold">
                      {place || "محافظة غير متاحة"}
                    </p>
                    <p className="text-brand-slate text-sm">{a.address}</p>
                    <p className="text-muted-foreground text-sm" dir="ltr">
                      {a.phone}
                    </p>
                  </div>
                  {a.is_default && (
                    <span className="bg-brand-blue/10 text-brand-blue rounded-full px-2 py-0.5 text-xs font-semibold">
                      الأساسي
                    </span>
                  )}
                </div>
                {!gov && (
                  <p className="text-destructive text-xs">
                    الشحن للمحافظة دي مش متاح حالياً.
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(a)}
                    className="text-brand-blue hover:bg-brand-ice flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium"
                  >
                    <Pencil className="size-4" aria-hidden />
                    تعديل
                  </button>
                  {!a.is_default && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => setDefaultAddress(a.id), "بقى العنوان الأساسي")
                      }
                      className="text-brand-navy hover:bg-brand-ice flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium"
                    >
                      <Star className="size-4" aria-hidden />
                      اجعله الأساسي
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm("تمسح العنوان ده؟"))
                        run(() => deleteAddress(a.id), "اتمسح العنوان")
                    }}
                    className="text-destructive hover:bg-destructive/10 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    مسح
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing ? (
        <AddressForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          governorates={governorates}
          defaultPhone={defaultPhone}
          canCancel={addresses.length > 0}
          onDone={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      ) : (
        addresses.length < 10 && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="border-border text-brand-navy hover:border-brand-blue flex items-center justify-center gap-2 rounded-2xl border border-dashed bg-white p-4 font-semibold"
          >
            <Plus className="size-5" aria-hidden />
            إضافة عنوان جديد
          </button>
        )
      )}
    </div>
  )
}

function AddressForm({
  initial,
  governorates,
  defaultPhone,
  canCancel,
  onDone,
}: {
  initial: SavedAddress | null
  governorates: ShippingGovernorate[]
  defaultPhone: string
  canCancel: boolean
  onDone: () => void
}) {
  const [form, setForm] = useState({
    governorate_id: initial ? String(initial.governorate_id) : "",
    city_id: initial?.city_id ? String(initial.city_id) : "",
    address: initial?.address ?? "",
    phone: initial?.phone ?? defaultPhone,
    is_default: initial?.is_default ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const governorate = governorates.find((g) => String(g.id) === form.governorate_id)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveAddress({ ...form, id: initial?.id })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        return void toast.error(result.error)
      }
      toast.success("اتحفظ العنوان")
      onDone()
    })
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5"
    >
      <h3 className="text-brand-navy font-bold">
        {initial ? "تعديل العنوان" : "عنوان جديد"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="governorate_id"
            className="text-brand-navy text-sm font-semibold"
          >
            المحافظة
          </label>
          <select
            id="governorate_id"
            value={form.governorate_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, governorate_id: e.target.value, city_id: "" }))
            }
            aria-invalid={!!errors.governorate_id || undefined}
            className={selectClass}
          >
            <option value="">اختار المحافظة</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {errors.governorate_id && (
            <p className="text-destructive text-sm">{errors.governorate_id}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city_id" className="text-brand-navy text-sm font-semibold">
            المدينة / المركز
          </label>
          <select
            id="city_id"
            value={form.city_id}
            onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value }))}
            disabled={!governorate}
            aria-invalid={!!errors.city_id || undefined}
            className={selectClass}
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
          {errors.city_id && <p className="text-destructive text-sm">{errors.city_id}</p>}
        </div>
      </div>
      <AuthField
        id="address"
        label="العنوان بالتفصيل"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        error={errors.address}
        hint="الشارع، رقم العمارة والدور والشقة، علامة مميزة"
        maxLength={300}
      />
      <AuthField
        id="phone"
        label="موبايل الاستلام"
        type="tel"
        dir="ltr"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        error={errors.phone}
        placeholder="01xxxxxxxxx"
        className="text-end"
      />
      <label className="text-brand-navy flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          className="accent-brand-blue size-4"
        />
        اجعله العنوان الأساسي
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <SubmitButton pending={pending}>
            {pending ? "جاري الحفظ…" : "حفظ العنوان"}
          </SubmitButton>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={onDone}
            className="border-border text-brand-navy rounded-xl border px-5 font-semibold"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}
