import Image from "next/image"
import Link from "next/link"

const columns = [
  {
    title: "تسوّق",
    links: [
      { label: "الساعات", href: "/c/watches" },
      { label: "الأزياء", href: "/c/fashion" },
      { label: "الأحذية", href: "/c/shoes" },
      { label: "الشنط", href: "/c/bags" },
    ],
  },
  {
    title: "المساعدة",
    links: [
      { label: "تتبع الطلب", href: "/track" },
      { label: "الأسئلة الشائعة", href: "/faq" },
      { label: "سياسة الشحن", href: "/policies/shipping" },
      { label: "سياسة الاسترجاع", href: "/policies/returns" },
    ],
  },
  {
    title: "Sheko",
    links: [
      { label: "من نحن", href: "/about" },
      { label: "تواصل معنا", href: "/contact" },
      { label: "سياسة الخصوصية", href: "/policies/privacy" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy mt-auto pb-24 text-[#b9c6e4] lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/sheko-icon-512.png" alt="" width={52} height={52} />
            <span className="font-heading text-brand-ice text-2xl font-bold">Sheko</span>
          </div>
          <p className="max-w-xs leading-relaxed">
            ساعات وأزياء وإكسسوارات مختارة بعناية. شحن لكل المحافظات والدفع عند الاستلام.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-brand-ice mb-4 text-lg font-bold">{column.title}</h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-brand-cyan transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm">
        © {new Date().getFullYear()} Sheko. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
