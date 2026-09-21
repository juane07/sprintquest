"use client"
import { useEffect } from "react"

export default function PwaRegister() {
  useEffect(() => {
    // Force-clear any old PWA cache that was serving stale HTML (v1/v2 cached "/")
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) {
          if (r.active && r.active.scriptURL.includes("sw.js")) {
            // v1/v2 had "/" cached — force update to v3 which only caches icons
            r.update().catch(() => {})
          }
        }
      })
      // Also wipe old sq-static caches on client
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const k of keys) if (k.startsWith("sq-static-v1") || k.startsWith("sq-static-v2")) caches.delete(k)
        })
      }
    }
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])
  return null
}
