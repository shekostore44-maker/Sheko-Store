import { Star } from "lucide-react"

/** Read-only star rating (supports halves visually by rounding). */
export function Stars({
  value,
  className = "size-4",
}: {
  value: number
  className?: string
}) {
  const rounded = Math.round(value)
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} من 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={`${className} ${n <= rounded ? "fill-[#f5a524] text-[#f5a524]" : "text-border fill-transparent"}`}
        />
      ))}
    </span>
  )
}
