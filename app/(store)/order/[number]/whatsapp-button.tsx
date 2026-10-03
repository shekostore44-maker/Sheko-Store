"use client"

import { useEffect } from "react"

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.22-.36A9.4 9.4 0 0 1 2.6 12C2.6 6.8 6.84 2.56 12.05 2.56c2.52 0 4.89.98 6.67 2.77A9.37 9.37 0 0 1 21.5 12c0 5.2-4.24 9.44-9.45 9.44M20.08 3.92A11.3 11.3 0 0 0 12.05.6C5.78.6.67 5.7.67 11.98c0 2 .52 3.96 1.52 5.69L.57 23.6l6.07-1.6a11.37 11.37 0 0 0 5.4 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.35-8.07" />
    </svg>
  )
}

/** Opens WhatsApp once right after the order is placed, and stays as a button. */
export function WhatsappButton({
  url,
  autoOpen,
  orderNumber,
}: {
  url: string
  autoOpen: boolean
  orderNumber: string
}) {
  useEffect(() => {
    if (!autoOpen) return
    // Drop "new=1" so a refresh or back button doesn't open WhatsApp again
    // (history API: no server round trip, so this effect isn't re-run).
    const address = new URL(window.location.href)
    address.searchParams.delete("new")
    window.history.replaceState(null, "", address)

    const key = `sheko-wa-opened-${orderNumber}`
    try {
      if (sessionStorage.getItem(key)) return
    } catch {
      // Storage blocked: still open it once for this page view.
    }
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(key, "1")
      } catch {}
      window.location.assign(url)
    }, 1200)
    return () => clearTimeout(timer)
  }, [autoOpen, orderNumber, url])

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-13 items-center justify-center gap-2 rounded-xl bg-[#25d366] px-8 text-lg font-bold text-white hover:bg-[#1ebe5b]"
    >
      <WhatsappIcon />
      ابعت الطلب على واتساب
    </a>
  )
}
