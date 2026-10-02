/**
 * Turns a product or category name into a URL slug.
 * Keeps Arabic and Latin letters and digits, so "ساعة كلاسيك جلد"
 * becomes "ساعة-كلاسيك-جلد" and "Classic Watch" becomes "classic-watch".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "") // Arabic diacritics and tatweel
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "")
}

/** Same shape slugify produces: words of letters/digits joined by single dashes. */
export const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u
