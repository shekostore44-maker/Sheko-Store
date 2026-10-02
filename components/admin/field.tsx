import { Label } from "@/components/ui/label"

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-brand-navy">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

/** Styled native <select>: accessible, works with RTL and on every phone. */
export function NativeSelect(props: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-10 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 ${props.className ?? ""}`}
    />
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-brand-navy text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
