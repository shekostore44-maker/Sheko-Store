import { Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react"

const items = [
  { icon: Truck, label: "شحن لكل المحافظات", tone: "blue" },
  { icon: Banknote, label: "الدفع عند الاستلام", tone: "blue" },
  { icon: MessageCircle, label: "اطلب عبر واتساب", tone: "green" },
  { icon: RotateCcw, label: "استرجاع خلال 14 يوم", tone: "blue" },
] as const

export function TrustBar() {
  return (
    <section aria-label="مميزات الشراء" className="border-border bg-background border-b">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4">
        {items.map(({ icon: Icon, label, tone }) => (
          <li key={label} className="flex items-center gap-3">
            <span
              className={
                tone === "green"
                  ? "bg-success-soft text-success grid size-11 shrink-0 place-items-center rounded-xl"
                  : "text-brand-blue grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f0ff]"
              }
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-brand-navy text-sm font-semibold sm:text-base">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
