"use server"

import { getTrackedOrder, type CustomerOrder } from "@/lib/orders/queries"

export type TrackState =
  | { order?: CustomerOrder; error?: string; values?: { number: string; phone: string } }
  | undefined

export async function trackOrder(
  _prev: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const number = String(formData.get("number") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const values = { number, phone }
  if (!number || !phone) return { error: "اكتب رقم الطلب ورقم الموبايل", values }

  const order = await getTrackedOrder(number, phone)
  if (!order) {
    return {
      error:
        "مش لاقيين طلب بالرقم ده والموبايل ده. اتأكد إنهم نفس اللي اتكتبوا وقت الطلب.",
      values,
    }
  }
  return { order, values }
}
