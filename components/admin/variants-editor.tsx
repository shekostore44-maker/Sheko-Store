"use client"

import { Plus, Sparkles, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export type OptionGroup = { name: string; values: string }

export type EditableVariant = {
  id?: string
  name: string
  options: Record<string, string>
  price: string
  stock: string
  sku: string
  is_active: boolean
}

const MAX_GROUPS = 2

/** Every combination of the option values, e.g. كحلي / M, كحلي / L, … */
function combinations(groups: { name: string; values: string[] }[]) {
  return groups.reduce<Record<string, string>[]>(
    (acc, group) =>
      acc.flatMap((combo) =>
        group.values.map((value) => ({ ...combo, [group.name]: value })),
      ),
    [{}],
  )
}

const splitValues = (text: string) => [
  ...new Set(
    text
      .split(/[,،]/)
      .map((v) => v.trim())
      .filter(Boolean),
  ),
]

/** Rebuilds option groups from saved variants when editing a product. */
export function groupsFromVariants(
  variants: { options: Record<string, string> }[],
): OptionGroup[] {
  const groups = new Map<string, string[]>()
  for (const { options } of variants) {
    for (const [name, value] of Object.entries(options)) {
      const values = groups.get(name) ?? []
      if (!values.includes(value)) values.push(value)
      groups.set(name, values)
    }
  }
  return [...groups].map(([name, values]) => ({ name, values: values.join("، ") }))
}

export function VariantsEditor({
  groups,
  onGroupsChange,
  variants,
  onVariantsChange,
  basePrice,
  errors,
}: {
  groups: OptionGroup[]
  onGroupsChange: (groups: OptionGroup[]) => void
  variants: EditableVariant[]
  onVariantsChange: (variants: EditableVariant[]) => void
  basePrice: string
  errors: Record<string, string>
}) {
  function generate() {
    const parsed = groups
      .map((g) => ({ name: g.name.trim(), values: splitValues(g.values) }))
      .filter((g) => g.name && g.values.length)
    if (!parsed.length) return onVariantsChange([])

    // Keep prices/stock already typed for combinations that still exist.
    const byName = new Map(variants.map((v) => [v.name, v]))
    onVariantsChange(
      combinations(parsed).map((options) => {
        const name = Object.values(options).join(" / ")
        return (
          byName.get(name) ?? {
            name,
            options,
            price: "",
            stock: "0",
            sku: "",
            is_active: true,
          }
        )
      }),
    )
  }

  const update = (index: number, patch: Partial<EditableVariant>) =>
    onVariantsChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {groups.map((group, index) => (
          <div key={index} className="grid grid-cols-[8rem_1fr_auto] items-center gap-2">
            <Input
              value={group.name}
              onChange={(e) =>
                onGroupsChange(
                  groups.map((g, i) =>
                    i === index ? { ...g, name: e.target.value } : g,
                  ),
                )
              }
              placeholder={index === 0 ? "اللون" : "المقاس"}
              aria-label="اسم الخيار"
              className="h-10"
            />
            <Input
              value={group.values}
              onChange={(e) =>
                onGroupsChange(
                  groups.map((g, i) =>
                    i === index ? { ...g, values: e.target.value } : g,
                  ),
                )
              }
              placeholder={index === 0 ? "كحلي، أزرق، بني" : "S، M، L، XL"}
              aria-label="القيم مفصولة بفاصلة"
              className="h-10"
            />
            <button
              type="button"
              onClick={() => onGroupsChange(groups.filter((_, i) => i !== index))}
              aria-label="حذف الخيار"
              className="text-destructive hover:bg-destructive/10 rounded-lg p-2"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {groups.length < MAX_GROUPS && (
            <button
              type="button"
              onClick={() => onGroupsChange([...groups, { name: "", values: "" }])}
              className="border-brand-blue text-brand-blue inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-2 text-sm font-semibold"
            >
              <Plus className="size-4" aria-hidden />
              {groups.length ? "خيار تاني (زي المقاس)" : "أضف خيار (زي اللون)"}
            </button>
          )}
          {groups.length > 0 && (
            <button
              type="button"
              onClick={generate}
              className="bg-brand-navy text-brand-ice inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold"
            >
              <Sparkles className="size-4" aria-hidden />
              توليد المتغيرات
            </button>
          )}
        </div>
        {groups.length > 0 && (
          <p className="text-muted-foreground text-xs">
            اكتب القيم مفصولة بفاصلة، وبعدين اضغط «توليد المتغيرات».
          </p>
        )}
      </div>

      {variants.length > 0 && (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-semibold">المتغير</th>
                <th className="px-3 py-2 text-start font-semibold">السعر</th>
                <th className="px-3 py-2 text-start font-semibold">المخزون</th>
                <th className="px-3 py-2 text-start font-semibold">الكود</th>
                <th className="px-3 py-2 text-center font-semibold">متاح</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.name} className="border-border border-t">
                  <td className="text-brand-navy px-3 py-2 font-medium whitespace-nowrap">
                    {variant.name}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      inputMode="decimal"
                      value={variant.price}
                      onChange={(e) => update(index, { price: e.target.value })}
                      placeholder={basePrice || "سعر المنتج"}
                      aria-label={`سعر ${variant.name}`}
                      aria-invalid={Boolean(errors[`variants.${index}.price`])}
                      className="h-9 w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      inputMode="numeric"
                      value={variant.stock}
                      onChange={(e) => update(index, { stock: e.target.value })}
                      aria-label={`مخزون ${variant.name}`}
                      aria-invalid={Boolean(errors[`variants.${index}.stock`])}
                      className="h-9 w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      dir="ltr"
                      value={variant.sku}
                      onChange={(e) => update(index, { sku: e.target.value })}
                      aria-label={`كود ${variant.name}`}
                      aria-invalid={Boolean(errors[`variants.${index}.sku`])}
                      className="h-9 w-28"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) => update(index, { is_active: checked })}
                      aria-label={`إتاحة ${variant.name}`}
                    />
                  </td>
                  <td className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        onVariantsChange(variants.filter((_, i) => i !== index))
                      }
                      aria-label={`حذف ${variant.name}`}
                      className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted-foreground border-border border-t px-3 py-2 text-xs">
            السعر الفاضي = سعر المنتج الأساسي. مخزون المنتج = مجموع مخزون المتغيرات
            المتاحة.
          </p>
        </div>
      )}
    </div>
  )
}
