const CACHE_NAME = 'nicori-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/logo.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned)
            })
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned)
          })
        }
        return response
      })
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
