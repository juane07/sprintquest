/* SprintQuest service worker: cache app shell + static assets, never block live data. */
const STATIC_CACHE = "sq-static-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(["/", "/icons/icon-192.png", "/icons/icon-512.png"])).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  // Cache-first for versioned Next.js assets and icons only.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone()
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
      return res
    })))
    return
  }
  // Everything else (pages, API, Supabase): network only — live data must never go stale.
})
