const CACHE_NAME = 'under-pines-v1'
const STATIC_CACHE = 'under-pines-static-v1'

// Files to precache (app shell)
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/search',
  '/notifications'
]

// API routes to cache with stale-while-revalidate
const API_CACHE_PATTERNS = [
  /\/functions\/v1\/feed/,
  /\/functions\/v1\/search-people/,
  /\/functions\/v1\/suggestions/,
  /\/functions\/v1\/notifications/,
  /\/rest\/v1\/profiles/,
  /\/rest\/v1\/posts/
]

// Install event - precache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        console.log('[SW] Skip waiting')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Claiming clients')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests with stale-while-revalidate
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Handle static assets with cache-first
  if (url.origin === location.origin && 
      (url.pathname.startsWith('/assets/') || 
       url.pathname.startsWith('/icons/') ||
       url.pathname.endsWith('.css') ||
       url.pathname.endsWith('.js'))) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle Supabase storage URLs with cache-first
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Default: try network, fallback to cache
  event.respondWith(networkFirst(request))
})

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Start fetch in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // Return cached version immediately, if available
  return cachedResponse || networkPromise
}

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Cache-first failed:', error)
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
    
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline')
    }
    
    throw error
  }
}

// Handle background sync (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Placeholder for background sync functionality
  console.log('[SW] Performing background sync')
}