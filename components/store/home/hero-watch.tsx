"use client"

import { useEffect, useRef, useState } from "react"

import type { WatchScene } from "./watch-scene"

/**
 * Hero smart watch in 3D. The scene loads lazily once the hero is on screen
 * and the browser is idle, then fades in over the decorative rings. The box
 * has a fixed size (no layout shift); without WebGL only the rings show.
 */
export function HeroWatch() {
  const wrapper = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const scene = useRef<WatchScene | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = wrapper.current
    const host = stage.current
    if (!el || !host) return
    let cancelled = false
    let idle = 0

    const load = () => {
      const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      import("./watch-scene")
        .then(({ createWatchScene }) => {
          if (cancelled) return
          scene.current = createWatchScene(host, {
            coarsePointer,
            reducedMotion,
            onReady: () => setReady(true),
          })
        })
        // Keep the static image if the 3D code fails to load.
        .catch(() => {})
    }

    // Load only when the hero is visible, after the page has settled.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      // Older Safari has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(load, { timeout: 2000 })
      } else {
        idle = window.setTimeout(load, 300)
      }
    })
    observer.observe(el)

    return () => {
      cancelled = true
      observer.disconnect()
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      scene.current?.dispose()
      scene.current = null
    }
  }, [])

  return (
    <div
      ref={wrapper}
      className="absolute inset-[2%]"
      onPointerEnter={(e) => e.pointerType === "mouse" && scene.current?.setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && scene.current?.setHover(false)}
    >
      <div
        ref={stage}
        className={`absolute inset-0 transition-[opacity,scale] duration-1000 ease-out ${ready ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        style={{ touchAction: "pan-y" }}
      />
    </div>
  )
}
