"use client"
import { useEffect } from "react"

export default function PwaRegister() {
  useEffect(() => {
    // Kill stale PWA — v1/v2 cached "/" and blocked updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister()
      })
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const k of keys) if (k.startsWith("sq-static")) caches.delete(k)
        })
      }
    }
    // Do NOT re-register — PWA disabled until MVP stabilizes
  }, [])
  return null
}
