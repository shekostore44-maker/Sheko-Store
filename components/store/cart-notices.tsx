import { Info } from "lucide-react"

/** Explains what changed after the cart was re-checked against the store. */
export function CartNotices({ notices }: { notices: string[] }) {
  if (!notices.length) return null
  return (
    <div
      role="status"
      className="border-brand-blue/30 bg-brand-ice text-brand-navy flex gap-3 rounded-2xl border p-4 text-sm"
    >
      <Info className="text-brand-blue mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">حدّثنا سلتك بآخر الأسعار والكميات:</p>
        <ul className="mt-1 list-disc space-y-0.5 ps-5">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
