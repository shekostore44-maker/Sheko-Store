"use client"

import { Bell } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatNumber } from "@/lib/format"
import { formatDateTime } from "@/lib/orders/status"
import { createClient } from "@/lib/supabase/client"

import { markNotificationsRead } from "./orders/actions"

export type AdminNotification = {
  id: string
  order_id: string | null
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

/** Short two-tone chime made with Web Audio (no sound file to load). */
function playChime(context: AudioContext | null) {
  if (!context || context.state !== "running") return
  const now = context.currentTime
  for (const [i, freq] of [880, 1320].entries()) {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = "sine"
    osc.frequency.value = freq
    const start = now + i * 0.18
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
    osc.connect(gain).connect(context.destination)
    osc.start(start)
    osc.stop(start + 0.4)
  }
}

export function NotificationBell({
  initial,
  sound,
}: {
  initial: AdminNotification[]
  sound: boolean
}) {
  const [items, setItems] = useState(initial)
  const router = useRouter()
  const pathname = usePathname()
  const audio = useRef<AudioContext | null>(null)
  const latest = useRef({ pathname, sound })
  useEffect(() => {
    latest.current = { pathname, sound }
  })

  // Browsers only allow sound after the user has interacted with the page.
  useEffect(() => {
    if (!sound) return
    const unlock = () => {
      audio.current ??= new AudioContext()
      void audio.current.resume()
    }
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [sound])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as AdminNotification
          setItems((list) => [n, ...list.filter((x) => x.id !== n.id)].slice(0, 30))
          if (latest.current.sound) playChime(audio.current)
          toast.success(n.title, {
            description: n.body ?? undefined,
            duration: 15000,
            action: n.order_id
              ? {
                  label: "افتح الطلب",
                  onClick: () => router.push(`/admin/orders/${n.order_id}`),
                }
              : undefined,
          })
          const path = latest.current.pathname
          if (path === "/admin" || path.startsWith("/admin/orders")) router.refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router])

  const unread = items.filter((n) => !n.is_read)

  async function markAll() {
    const ids = unread.map((n) => n.id)
    setItems((list) => list.map((n) => ({ ...n, is_read: true })))
    const result = await markNotificationsRead()
    if (!result.ok) {
      setItems((list) =>
        list.map((n) => (ids.includes(n.id) ? { ...n, is_read: false } : n)),
      )
      toast.error(result.error)
    }
  }

  function open(n: AdminNotification) {
    if (!n.is_read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      void markNotificationsRead([n.id])
    }
    if (n.order_id) router.push(`/admin/orders/${n.order_id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={unread.length ? `الإشعارات: ${unread.length} جديد` : "الإشعارات"}
        className="text-brand-navy hover:bg-accent relative rounded-lg p-2"
      >
        <Bell className="size-5" />
        {unread.length > 0 && (
          <span className="bg-destructive absolute end-0.5 top-0.5 grid min-w-4.5 place-items-center rounded-full px-1 text-[0.65rem] leading-4.5 font-bold text-white">
            {unread.length > 9 ? "9+" : formatNumber(unread.length)}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-brand-navy font-bold">الإشعارات</p>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-brand-blue text-xs font-semibold"
            >
              تعليم الكل كمقروء
            </button>
          )}
        </div>
        {items.length ? (
          <div className="max-h-96 overflow-y-auto p-1">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => open(n)}
                className="flex flex-col items-start gap-0.5 rounded-md px-3 py-2"
              >
                <span className="flex w-full items-center gap-2">
                  {!n.is_read && (
                    <span
                      className="bg-brand-blue size-2 shrink-0 rounded-full"
                      aria-label="جديد"
                    />
                  )}
                  <span
                    className={`flex-1 text-sm ${n.is_read ? "text-brand-slate" : "text-brand-navy font-semibold"}`}
                  >
                    {n.title}
                  </span>
                </span>
                {n.body && (
                  <span className="text-muted-foreground text-xs">{n.body}</span>
                )}
                <span className="text-muted-foreground text-[0.7rem]">
                  {formatDateTime(n.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground p-6 text-center text-sm">
            مفيش إشعارات لسه.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
