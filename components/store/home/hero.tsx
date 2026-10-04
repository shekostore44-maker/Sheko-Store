import { Truck } from "lucide-react"
import Link from "next/link"

import { HeroWatch } from "./hero-watch"

export function Hero() {
  return (
    <section className="from-brand-ice overflow-hidden bg-gradient-to-b to-[#e9f0fb]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
        <div className="flex flex-col items-start gap-5">
          <span className="text-brand-blue rounded-full bg-[#dde8ff] px-4 py-1 text-sm font-semibold">
            مجموعة خريف 2026
          </span>
          <h1 className="text-brand-navy text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            أناقة بقوة الأسد
          </h1>
          <p className="text-brand-slate max-w-md text-lg leading-relaxed">
            ساعات وأزياء وإكسسوارات مختارة بعناية، وتوصيل حتى باب البيت.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#categories"
              className="bg-brand-navy text-brand-ice hover:bg-brand-navy-soft rounded-xl px-7 py-3 font-bold transition"
            >
              تسوّق الآن
            </Link>
            <Link
              href="/#offers"
              className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-brand-ice rounded-xl border-2 px-6 py-2.5 font-semibold transition"
            >
              شاهد العروض
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,#ffffff_0%,#d6e3fa_75%)]" />
          <div className="border-brand-blue/30 absolute inset-[3%] rounded-full border-2" />
          <div className="border-brand-cyan/50 absolute inset-[10%] rounded-full border-2 border-dashed" />
          <HeroWatch />
          <div className="shadow-brand-navy/10 absolute top-[6%] -right-[2%] flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-xl">
            <Truck className="text-brand-blue size-5" aria-hidden />
            <span className="text-brand-navy font-bold">شحن لكل المحافظات</span>
          </div>
          <div className="bg-brand-navy shadow-brand-navy/20 absolute top-[4%] left-0 rounded-2xl px-4 py-2.5 shadow-xl">
            <p className="text-sm text-[#b9c6e4]">ساعات ذكية</p>
            <p className="text-brand-ice font-bold">وصل حديثاً</p>
          </div>
        </div>
      </div>
    </section>
  )
}
