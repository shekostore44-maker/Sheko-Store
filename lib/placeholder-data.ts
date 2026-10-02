// Temporary data for the phase 1 preview.
// Replaced by categories from Supabase in phase 4.
export const placeholderCategories = [
  {
    name: "الساعات",
    slug: "watches",
    count: 48,
    image: "/placeholders/p-watch.svg",
    tint: "bg-[#eef2f9]",
  },
  {
    name: "الأزياء",
    slug: "fashion",
    count: 196,
    image: "/placeholders/p-tee.svg",
    tint: "bg-[#eef2f9]",
  },
  {
    name: "الأحذية",
    slug: "shoes",
    count: 84,
    image: "/placeholders/p-sneaker.svg",
    tint: "bg-[#eef2f9]",
  },
  {
    name: "الشنط",
    slug: "bags",
    count: 62,
    image: "/placeholders/p-bag.svg",
    tint: "bg-[#f3eee8]",
  },
] as const

export const mainNav = [
  { label: "الرئيسية", href: "/" },
  { label: "الأقسام", href: "/#categories" },
  { label: "وصل حديثاً", href: "/#new" },
  { label: "العروض", href: "/#offers" },
  { label: "تواصل معنا", href: "/contact" },
] as const
