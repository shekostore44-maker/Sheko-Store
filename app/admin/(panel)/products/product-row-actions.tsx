"use client"

import { Pencil } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { Switch } from "@/components/ui/switch"

import { deleteProduct, setProductActive } from "./actions"

export function ProductRowActions({
  id,
  name,
  isActive,
}: {
  id: string
  name: string
  isActive: boolean
}) {
  const [active, setActive] = useState(isActive)

  async function toggle(next: boolean) {
    setActive(next)
    const result = await setProductActive(id, next)
    if (!result.ok) {
      setActive(!next)
      toast.error(result.error)
    } else {
      toast.success(next ? `«${name}» اتنشر في المتجر` : `«${name}» بقى مسودة`)
    }
  }

  return (
    <>
      <div className="hidden justify-center md:flex">
        <Switch checked={active} onCheckedChange={toggle} aria-label={`نشر ${name}`} />
      </div>
      <div className="flex items-center justify-end gap-1 md:justify-center">
        <Link
          href={`/admin/products/${id}`}
          className="text-brand-blue hover:bg-brand-tint inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium"
        >
          <Pencil className="size-4" aria-hidden />
          <span className="hidden sm:inline">تعديل</span>
        </Link>
        <ConfirmDelete
          title={`حذف «${name}»؟`}
          description="هيتحذف المنتج وصوره نهائياً. الطلبات القديمة هتفضل محفوظة باسمه وسعره."
          onConfirm={async () => {
            const result = await deleteProduct(id)
            if (!result.ok) toast.error(result.error)
            else toast.success("اتحذف المنتج")
            return result.ok
          }}
        />
      </div>
    </>
  )
}
