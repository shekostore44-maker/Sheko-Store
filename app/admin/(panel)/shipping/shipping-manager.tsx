"use client"

import { ChevronDown, Loader2, Plus, Search } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { Switch } from "@/components/ui/switch"
import { formatNumber } from "@/lib/format"

import {
  addCity,
  deleteCity,
  saveGovernorate,
  setAllGovernoratesActive,
  setCityActive,
} from "./actions"

type City = { id: number; name: string; is_active: boolean }
export type AdminGovernorate = {
  id: number
  name: string
  shipping_fee: number
  min_days: number
  max_days: number
  is_active: boolean
  cities: City[]
}

const numberInput =
  "border-input focus-visible:ring-ring/50 aria-invalid:border-destructive h-9 w-full rounded-lg border bg-white px-2 text-center text-sm outline-none focus-visible:ring-3"

export function ShippingManager({ initial }: { initial: AdminGovernorate[] }) {
  const [governorates, setGovernorates] = useState(initial)
  const [filter, setFilter] = useState("")
  const [pending, startTransition] = useTransition()

  const activeCount = governorates.filter((g) => g.is_active).length
  const shown = governorates.filter((g) => g.name.includes(filter.trim()))

  const update = (id: number, changes: Partial<AdminGovernorate>) =>
    setGovernorates((list) => list.map((g) => (g.id === id ? { ...g, ...changes } : g)))

  function setAll(active: boolean) {
    startTransition(async () => {
      const result = await setAllGovernoratesActive(active)
      if (!result.ok) return void toast.error(result.error)
      setGovernorates((list) => list.map((g) => ({ ...g, is_active: active })))
      toast.success(active ? "كل المحافظات اتفعّلت" : "كل المحافظات اتقفلت")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-brand-navy font-semibold">
          شغّال: {formatNumber(activeCount)} من {formatNumber(governorates.length)} محافظة
        </p>
        <div className="relative ms-auto">
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ابحث عن محافظة"
            aria-label="ابحث عن محافظة"
            className="border-input focus-visible:ring-ring/50 h-9 w-48 rounded-lg border bg-white ps-9 pe-3 text-sm outline-none focus-visible:ring-3"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setAll(true)}
          className="border-border text-brand-navy h-9 rounded-lg border bg-white px-3 text-sm font-medium disabled:opacity-50"
        >
          تفعيل الكل
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setAll(false)}
          className="border-border text-brand-navy h-9 rounded-lg border bg-white px-3 text-sm font-medium disabled:opacity-50"
        >
          إيقاف الكل
        </button>
      </div>

      <div className="border-border overflow-hidden rounded-2xl border bg-white">
        <div className="bg-muted text-muted-foreground hidden grid-cols-[4rem_1fr_8rem_11rem_7rem_6rem] items-center gap-3 px-4 py-3 text-sm font-semibold md:grid">
          <span>مفعّلة</span>
          <span>المحافظة</span>
          <span className="text-center">الشحن (ج.م)</span>
          <span className="text-center">مدة التوصيل (أيام)</span>
          <span className="text-center">المدن</span>
          <span />
        </div>
        <ul>
          {shown.map((g) => (
            <GovernorateRow
              key={g.id}
              governorate={g}
              onChange={(changes) => update(g.id, changes)}
            />
          ))}
          {!shown.length && (
            <li className="text-muted-foreground p-8 text-center">
              مفيش محافظة بالاسم ده.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function GovernorateRow({
  governorate: g,
  onChange,
}: {
  governorate: AdminGovernorate
  onChange: (changes: Partial<AdminGovernorate>) => void
}) {
  const [draft, setDraft] = useState({
    fee: String(g.shipping_fee),
    min: String(g.min_days),
    max: String(g.max_days),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const dirty =
    Number(draft.fee) !== g.shipping_fee ||
    Number(draft.min) !== g.min_days ||
    Number(draft.max) !== g.max_days
  const activeCities = g.cities.filter((c) => c.is_active).length

  function save(changes: { is_active?: boolean } = {}) {
    const values = {
      id: g.id,
      shipping_fee: draft.fee.trim() === "" ? NaN : Number(draft.fee),
      min_days: Number(draft.min),
      max_days: Number(draft.max),
      is_active: changes.is_active ?? g.is_active,
    }
    // Toggling on/off alone shouldn't save half-typed fees.
    if (changes.is_active !== undefined && dirty) {
      values.shipping_fee = g.shipping_fee
      values.min_days = g.min_days
      values.max_days = g.max_days
    }
    startTransition(async () => {
      const result = await saveGovernorate(values)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.error)
        return
      }
      setErrors({})
      onChange(values)
      toast.success(
        changes.is_active === undefined
          ? `اتحفظ شحن ${g.name}`
          : changes.is_active
            ? `${g.name} اتفعّلت`
            : `${g.name} اتقفلت`,
      )
    })
  }

  const field = (key: keyof typeof draft, error?: string, label?: string) => (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      value={draft[key]}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
      onKeyDown={(e) => e.key === "Enter" && dirty && save()}
      aria-label={label}
      aria-invalid={!!error || undefined}
      className={numberInput}
    />
  )

  return (
    <li
      className={`border-border border-t first:border-t-0 ${g.is_active ? "" : "bg-muted/40"}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[4rem_1fr_8rem_11rem_7rem_6rem]">
        <Switch
          checked={g.is_active}
          onCheckedChange={(v) => save({ is_active: v })}
          disabled={pending}
          aria-label={`تفعيل الشحن لـ ${g.name}`}
        />
        <span
          className={`font-semibold ${g.is_active ? "text-brand-navy" : "text-muted-foreground"}`}
        >
          {g.name}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-brand-blue flex items-center justify-center gap-1 text-sm font-medium md:order-last md:col-start-5"
        >
          {formatNumber(activeCities)}/{formatNumber(g.cities.length)}
          <span className="md:hidden">مدينة</span>
          <ChevronDown
            className={`size-4 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        <div className="col-span-3 grid grid-cols-2 gap-3 md:col-span-1 md:col-start-3 md:row-start-1 md:block">
          <label className="flex flex-col gap-1 md:block">
            <span className="text-muted-foreground text-xs md:hidden">الشحن (ج.م)</span>
            {field("fee", errors.shipping_fee, `سعر الشحن لـ ${g.name}`)}
          </label>
          <div className="flex flex-col gap-1 md:hidden">
            <span className="text-muted-foreground text-xs">مدة التوصيل (أيام)</span>
            <div className="flex items-center gap-1">
              {field("min", errors.min_days, "أقل مدة")}
              <span className="text-muted-foreground">–</span>
              {field("max", errors.max_days, "أقصى مدة")}
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1 md:col-start-4 md:row-start-1 md:flex">
          {field("min", errors.min_days, "أقل مدة")}
          <span className="text-muted-foreground">–</span>
          {field("max", errors.max_days, "أقصى مدة")}
        </div>
        <div className="col-span-3 flex justify-end md:col-span-1 md:col-start-6 md:row-start-1">
          {dirty && (
            <button
              type="button"
              onClick={() => save()}
              disabled={pending}
              className="bg-brand-blue flex h-9 items-center gap-1 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              حفظ
            </button>
          )}
        </div>
      </div>
      {open && (
        <CitiesPanel governorate={g} onChange={(cities) => onChange({ cities })} />
      )}
    </li>
  )
}

function CitiesPanel({
  governorate: g,
  onChange,
}: {
  governorate: AdminGovernorate
  onChange: (cities: City[]) => void
}) {
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()

  function add(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await addCity(g.id, name)
      if (!result.ok) return void toast.error(result.error)
      onChange([...g.cities, { ...result.data, is_active: true }])
      setName("")
      toast.success(`«${result.data.name}» اتضافت`)
    })
  }

  async function toggle(city: City, active: boolean) {
    onChange(g.cities.map((c) => (c.id === city.id ? { ...c, is_active: active } : c)))
    const result = await setCityActive(city.id, active)
    if (!result.ok) {
      onChange(g.cities)
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-brand-ice border-border border-t px-4 py-4">
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`مدينة أو مركز جديد في ${g.name}`}
          aria-label="اسم المدينة الجديدة"
          maxLength={60}
          className="border-input focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-3"
        />
        <button
          type="submit"
          disabled={pending || name.trim().length < 2}
          className="bg-brand-navy text-brand-ice flex h-9 items-center gap-1 rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          إضافة
        </button>
      </form>
      {g.cities.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {g.cities.map((city) => (
            <li
              key={city.id}
              className="border-border flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5"
            >
              <Switch
                checked={city.is_active}
                onCheckedChange={(v) => toggle(city, v)}
                aria-label={`تفعيل ${city.name}`}
              />
              <span
                className={`flex-1 text-sm ${city.is_active ? "text-brand-navy" : "text-muted-foreground line-through"}`}
              >
                {city.name}
              </span>
              <ConfirmDelete
                title={`حذف «${city.name}»؟`}
                description="المدينة هتختفي من صفحة الطلب. الطلبات القديمة هتفضل محفوظة باسم المدينة. لو عايز تخفيها مؤقتاً، اقفلها بدل الحذف."
                onConfirm={async () => {
                  const result = await deleteCity(city.id)
                  if (!result.ok) {
                    toast.error(result.error)
                    return false
                  }
                  onChange(g.cities.filter((c) => c.id !== city.id))
                  toast.success("اتحذفت المدينة")
                  return true
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          مفيش مدن لسه. ضيف أول مدينة من فوق.
        </p>
      )}
    </div>
  )
}
