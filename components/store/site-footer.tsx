import { Banknote, MessageCircle, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import type { NavCategory } from "@/lib/catalog/store-queries"

export function SiteFooter({ categories }: { categories: NavCategory[] }) {
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

        {categories.length > 0 && (
          <nav aria-label="الأقسام">
            <h2 className="text-brand-ice mb-4 text-lg font-bold">الأقسام</h2>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/c/${category.slug}`}
                    className="hover:text-brand-cyan transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label="تسوّق">
          <h2 className="text-brand-ice mb-4 text-lg font-bold">تسوّق</h2>
          <ul className="space-y-2.5">
            <li>
              <Link href="/#new" className="hover:text-brand-cyan transition-colors">
                وصل حديثاً
              </Link>
            </li>
            <li>
              <Link href="/#offers" className="hover:text-brand-cyan transition-colors">
                العروض
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-brand-cyan transition-colors">
                البحث
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-brand-cyan transition-colors">
                تتبع الطلب
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-brand-cyan transition-colors">
                حسابي
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-brand-ice mb-4 text-lg font-bold">طلبك معانا</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Truck className="text-brand-cyan size-4 shrink-0" aria-hidden /> شحن لكل
              المحافظات
            </li>
            <li className="flex items-center gap-2">
              <Banknote className="text-brand-cyan size-4 shrink-0" aria-hidden /> الدفع
              عند الاستلام
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="text-brand-cyan size-4 shrink-0" aria-hidden />{" "}
              تأكيد الطلب عبر واتساب
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm">
        © {new Date().getFullYear()} Sheko. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
