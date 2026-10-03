"use client"

import { Loader2, RotateCcw } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Field, Section } from "@/components/admin/field"
import { Switch } from "@/components/ui/switch"
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_VARIABLES,
  toWhatsappNumber,
  whatsappMessage,
  whatsappUrl,
  type WhatsappOrder,
} from "@/lib/orders/whatsapp"

import { saveNotificationSettings, saveWhatsappSettings } from "./actions"

/** Sample order for the live message preview. */
const SAMPLE: WhatsappOrder = {
  order_number: "SH-10001",
  customer_name: "أحمد محمود",
  phone: "01012345678",
  governorate_name: "القاهرة",
  city_name: "مدينة نصر",
  address: "12 ش عباس العقاد، الدور 3",
  notes: null,
  subtotal: 2030,
  shipping_fee: 50,
  total: 2080,
  items: [
    {
      product_name: "ساعة كلاسيك",
      product_slug: "classic-watch",
      variant_name: "كحلي",
      quantity: 1,
      line_total: 1250,
    },
    {
      product_name: "نظارة شمس",
      product_slug: "sunglasses",
      variant_name: null,
      quantity: 1,
      line_total: 780,
    },
  ],
}

const textInput =
  "border-input focus-visible:ring-ring/50 aria-invalid:border-destructive w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-3"

export function SettingsForm({
  whatsapp,
  sound: initialSound,
}: {
  whatsapp: { number: string; template: string }
  sound: boolean
}) {
  const [number, setNumber] = useState(whatsapp.number)
  const [template, setTemplate] = useState(whatsapp.template)
  const [numberError, setNumberError] = useState("")
  const [sound, setSound] = useState(initialSound)
  const [pending, startTransition] = useTransition()
  const templateRef = useRef<HTMLTextAreaElement>(null)

  const normalized = toWhatsappNumber(number)
  const preview = whatsappMessage(SAMPLE, template)

  function insertVariable(key: string) {
    const el = templateRef.current
    const token = `{${key}}`
    if (!el) return setTemplate((t) => t + token)
    const start = el.selectionStart
    const end = el.selectionEnd
    setTemplate(template.slice(0, start) + token + template.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveWhatsappSettings({ number, template })
      if (!result.ok) {
        setNumberError(result.fieldErrors?.number ?? "")
        return void toast.error(result.error)
      }
      setNumberError("")
      if (result.data.number) setNumber(result.data.number)
      toast.success("اتحفظت إعدادات الواتساب")
    })
  }

  async function toggleSound(next: boolean) {
    setSound(next)
    const result = await saveNotificationSettings({ sound: next })
    if (!result.ok) {
      setSound(!next)
      toast.error(result.error)
    } else toast.success(next ? "صوت الإشعارات اشتغل" : "صوت الإشعارات اتقفل")
  }

  return (
    <>
      <form onSubmit={save} className="flex flex-col gap-5">
        <Section
          title="واتساب الطلبات"
          description="بعد ما العميل يأكد طلبه، بيتفتحله واتساب على الرقم ده برسالة فيها كل تفاصيل الطلب."
        >
          <Field
            label="رقم واتساب المتجر"
            htmlFor="wa-number"
            error={numberError}
            hint={
              number && normalized ? (
                <>
                  هيتبعت على <span dir="ltr">+{normalized}</span> —{" "}
                  <a
                    href={whatsappUrl(normalized, "تجربة من لوحة تحكم Sheko")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue font-semibold"
                  >
                    جرّب الرقم
                  </a>
                </>
              ) : (
                "لو سبته فاضي، العميل هيشوف صفحة تأكيد من غير زرار واتساب."
              )
            }
          >
            <input
              id="wa-number"
              type="tel"
              dir="ltr"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="01012345678"
              aria-invalid={!!numberError || undefined}
              className={`${textInput} h-10 max-w-xs text-end`}
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Field label="نص الرسالة" htmlFor="wa-template">
                <textarea
                  id="wa-template"
                  ref={templateRef}
                  rows={14}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className={`${textInput} py-2 leading-relaxed`}
                />
              </Field>
              <p className="text-muted-foreground text-xs">
                اضغط على متغير عشان تحطه مكان المؤشر:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(WHATSAPP_VARIABLES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertVariable(key)}
                    title={label}
                    className="bg-brand-ice text-brand-navy hover:bg-brand-tint rounded-full px-2.5 py-1 text-xs"
                  >
                    {label}{" "}
                    <span dir="ltr" className="text-muted-foreground">{`{${key}}`}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
                className="text-muted-foreground hover:text-brand-navy flex items-center gap-1 self-start text-xs"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                رجّع النص الافتراضي
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-brand-navy text-sm font-medium">معاينة (طلب تجريبي)</p>
              <div className="flex-1 rounded-xl bg-[#e5ddd5] p-3">
                <div className="max-w-[95%] rounded-lg rounded-tl-none bg-[#dcf8c6] p-3 text-sm leading-relaxed whitespace-pre-wrap text-[#111b21] shadow-sm">
                  {preview}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-brand-blue flex h-10 items-center gap-2 self-start rounded-lg px-6 font-semibold text-white disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            حفظ
          </button>
        </Section>
      </form>

      <Section title="الإشعارات" description="لما يوصل طلب جديد وإنت فاتح لوحة التحكم.">
        <label className="flex items-center gap-3">
          <Switch checked={sound} onCheckedChange={toggleSound} />
          <span className="text-brand-navy text-sm">تشغيل صوت تنبيه مع الطلب الجديد</span>
        </label>
      </Section>
    </>
  )
}
