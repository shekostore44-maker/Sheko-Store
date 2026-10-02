import { Heart, Home, LayoutGrid, User } from "lucide-react"
import Link from "next/link"

const items = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "الأقسام", href: "/#categories", icon: LayoutGrid },
  { label: "المفضلة", href: "/wishlist", icon: Heart },
  { label: "حسابي", href: "/account", icon: User },
] as const

export function MobileBottomNav() {
  return (
    <nav
      aria-label="التنقل السريع"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {items.map(({ label, href, icon: Icon }, i) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-medium ${
                i === 0 ? "text-brand-blue" : "text-[#8a97b5]"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
