const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

/** 1250 → "1,250 ج.م" (Western digits, matching the store design). */
export function formatPrice(value: number) {
  return `${numberFormat.format(value)} ج.م`
}

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

/** Percentage off, or 0 when there is no real discount. */
export function discountPercent(price: number, compareAt: number | null) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round((1 - price / compareAt) * 100)
}

/** Route params may arrive percent-encoded (Arabic slugs); decode safely. */
export function decodeParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Arabic count wording: 1 → "منتج واحد", 2 → "منتجان", 3–10 → plural,
 * 0 and 11+ → singular ("15 منتج").
 */
export function countLabel(
  n: number,
  forms: { one: string; two: string; few: string; many: string },
) {
  if (n === 1) return forms.one
  if (n === 2) return forms.two
  if (n >= 3 && n <= 10) return `${formatNumber(n)} ${forms.few}`
  return `${formatNumber(n)} ${forms.many}`
}

export const productCount = (n: number) =>
  countLabel(n, { one: "منتج واحد", two: "منتجان", few: "منتجات", many: "منتج" })

export const resultCount = (n: number) =>
  countLabel(n, { one: "نتيجة واحدة", two: "نتيجتان", few: "نتائج", many: "نتيجة" })
