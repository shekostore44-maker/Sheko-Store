"use client"

import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { CartNotices } from "@/components/store/cart-notices"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MAX_LINE_QUANTITY,
  cartCount,
  cartKey,
  cartSubtotal,
  removeFromCart,
  setQuantity,
  useCart,
  useHydrated,
} from "@/lib/cart/store"
import { useCartRefresh } from "@/lib/cart/use-cart-refresh"
import { formatPrice, pieceCount } from "@/lib/format"

export function CartView() {
  const hydrated = useHydrated()
  const items = useCart()
  const { notices } = useCartRefresh()

  if (!hydrated) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <CartNotices notices={notices} />
        <div className="border-border flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
          <span className="bg-brand-ice text-brand-blue grid size-16 place-items-center rounded-full">
            <ShoppingBag className="size-8" aria-hidden />
          </span>
          <p className="text-brand-navy text-lg font-bold">سلتك فاضية</p>
          <p className="text-muted-foreground">تصفّح المنتجات وضيف اللي يعجبك.</p>
          <Link
            href="/"
            className="bg-brand-navy text-brand-ice rounded-xl px-6 py-3 font-semibold"
          >
            ابدأ التسوق
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  return (
    <div className="mt-6 grid items-start gap-6 pb-24 lg:grid-cols-[1fr_22rem] lg:pb-0">
      <div className="flex flex-col gap-3">
        <CartNotices notices={notices} />
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const key = cartKey(item)
            const max = Math.min(item.maxQuantity, MAX_LINE_QUANTITY)
            return (
              <li
                key={key}
                className="border-border flex gap-3 rounded-2xl border bg-white p-3 sm:gap-4 sm:p-4"
              >
                <Link
                  href={`/p/${item.slug}`}
                  className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/p/${item.slug}`}
                      className="text-brand-navy hover:text-brand-blue line-clamp-2 font-semibold"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(key)}
                      aria-label={`احذف ${item.name} من السلة`}
                      className="text-muted-foreground hover:text-destructive -m-1 shrink-0 p-1"
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </div>
                  {item.variantName && (
                    <p className="text-muted-foreground text-sm">{item.variantName}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                    <div className="border-border flex items-center rounded-lg border">
                      <button
                        type="button"
                        onClick={() => setQuantity(key, item.quantity + 1)}
                        disabled={item.quantity >= max}
                        aria-label="زيادة الكمية"
                        className="text-brand-navy p-2 disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <span
                        className="text-brand-navy w-7 text-center text-sm font-bold"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(key, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="تقليل الكمية"
                        className="text-brand-navy p-2 disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-end">
                      <p className="text-brand-navy font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-muted-foreground text-xs">
                          {formatPrice(item.price)} للقطعة
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <Link href="/" className="text-brand-blue self-start text-sm font-semibold">
          ← كمّل التسوق
        </Link>
      </div>

      <aside className="border-border flex flex-col gap-4 rounded-2xl border bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-brand-navy text-lg font-bold">ملخص الطلب</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-slate">
              المنتجات ({pieceCount(cartCount(items))})
            </dt>
            <dd className="text-brand-navy font-semibold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-slate">الشحن</dt>
            <dd className="text-muted-foreground">حسب المحافظة</dd>
          </div>
        </dl>
        <div className="border-border flex justify-between border-t pt-3">
          <span className="text-brand-navy font-bold">الإجمالي قبل الشحن</span>
          <span className="text-brand-navy text-lg font-bold">
            {formatPrice(subtotal)}
          </span>
        </div>
        <p className="bg-muted text-brand-slate flex items-center gap-2 rounded-xl p-3 text-xs">
          <Truck className="text-brand-blue size-4 shrink-0" aria-hidden />
          الدفع كاش عند الاستلام
        </p>
        <Link
          href="/checkout"
          className="bg-brand-navy text-brand-ice hidden h-12 items-center justify-center rounded-xl font-bold lg:flex"
        >
          إتمام الطلب
        </Link>
      </aside>

      {/* Mobile: the checkout button stays above the bottom nav. */}
      <div className="border-border bg-background/95 fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs">الإجمالي قبل الشحن</p>
          <p className="text-brand-navy font-bold">{formatPrice(subtotal)}</p>
        </div>
        <Link
          href="/checkout"
          className="bg-brand-navy text-brand-ice flex h-12 items-center rounded-xl px-6 font-bold"
        >
          إتمام الطلب
        </Link>
      </div>
    </div>
  )
}
