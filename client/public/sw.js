// Service Worker for AetherPulse
// Provides offline support and better caching for improved Core Web Vitals

const CACHE_NAME = 'aetherpulse-v2'
const OFFLINE_CACHE = 'aetherpulse-offline-v1'

// Files to cache for offline use
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icons/logo.png',
  '/icons/logo-192.png',
  '/icons/logo-512.png',
  '/manifest.json',
]

// API cache strategy - Network first, then cache
const API_CACHE_NAME = 'aetherpulse-api-v1'
const API_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets')
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => {
        console.log('Service Worker: Assets cached successfully')
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets:', error)
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== API_CACHE_NAME) {
            console.log(`Service Worker: Deleting old cache ${cacheName}`)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isApiRequest = url.pathname.startsWith('/api/')
  const isAssetRequest = ASSETS_TO_CACHE.some(asset => 
    url.pathname === asset || url.pathname.endsWith(asset)
  )
  
  // Cache API responses with TTL
  if (isApiRequest) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(event.request).then((response) => {
          // Clone the response for caching
          const responseClone = response.clone()
          
          // Only cache successful GET requests
          if (response.status === 200 && event.request.method === 'GET') {
            const cacheData = {
              response: responseClone,
              timestamp: Date.now()
            }
            cache.put(event.request, JSON.stringify(cacheData))
          }
          
          return response
        }).catch(() => {
          // Fallback to cache if network fails
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              const data = JSON.parse(cachedResponse)
              // Check TTL
              if (Date.now() - data.timestamp < API_CACHE_TTL) {
                return data.response
              }
            }
            // Return offline response
            return new Response(JSON.stringify({ 
              error: 'Offline', 
              message: 'You are offline. Please check your connection.' 
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
      })
    )
  }
  
  // Cache and return static assets
  if (isAssetRequest) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log(`Service Worker: Returning cached asset for ${event.request.url}`)
          return response
        }
        
        // Cache and return from network
        return fetch(event.request).then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
      })
    )
  }
  
  // For other requests, use network first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response('Offline - Please check your connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        })
      })
    })
  )
})

// Listen for push notifications (for future PWA features)
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  const title = data?.title || 'AetherPulse'
  const options = {
    body: data?.body || 'Masz nowe powiadomienie',
    icon: '/icons/logo-192.png',
    badge: '/icons/logo-192.png',
    data: data?.data || {}
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.notification.data.url) {
    clients.openWindow(event.notification.data.url)
  } else {
    clients.openWindow('/')
  }
})

console.log('Service Worker: Loaded')