import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسار الصفحة" className="text-muted-foreground text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft className="size-3.5" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-blue">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-brand-navy font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
