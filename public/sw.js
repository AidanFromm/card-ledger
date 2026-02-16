// CardLedger Service Worker v2.0
// Enhanced caching, offline support, and push notifications

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `cardledger-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cardledger-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `cardledger-images-${CACHE_VERSION}`;
const API_CACHE = `cardledger-api-${CACHE_VERSION}`;

// Cache limits
const MAX_DYNAMIC_ITEMS = 100;
const MAX_IMAGE_ITEMS = 500;
const MAX_API_ITEMS = 50;
const IMAGE_CACHE_DAYS = 7;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo-icon.jpg',
  '/apple-touch-icon.png',
  '/offline.html',
];

// Offline fallback page
const OFFLINE_PAGE = '/offline.html';

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => {
              return key.startsWith('cardledger-') && 
                !key.includes(CACHE_VERSION);
            })
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // Take control immediately
      self.clients.claim(),
    ])
  );
});

// ============================================
// FETCH EVENT - Smart Caching Strategy
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extensions and devtools
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
    // Allow localhost in dev but don't cache
    if (url.hostname === 'localhost') {
      return;
    }
    return;
  }

  // Route based on request type
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isImageRequest(request, url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// ============================================
// REQUEST TYPE CHECKERS
// ============================================
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isImageRequest(request, url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const isImagePath = imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
  const isImageType = request.destination === 'image';
  const isCardImageHost = url.hostname.includes('images.pokemontcg.io') ||
                          url.hostname.includes('tcgplayer') ||
                          url.hostname.includes('cardmarket') ||
                          url.hostname.includes('ebay');
  return isImagePath || isImageType || isCardImageHost;
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api') ||
         url.hostname.includes('supabase') ||
         url.hostname.includes('justtcg');
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.json'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.includes('/assets/');
}

// ============================================
// REQUEST HANDLERS
// ============================================

// Navigation: Network first, fallback to cache, then offline page
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Fallback to main page (SPA)
    const mainPage = await caches.match('/');
    if (mainPage) return mainPage;
    
    // Last resort: offline page
    return caches.match(OFFLINE_PAGE);
  }
}

// Images: Cache first with background update (stale-while-revalidate)
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(IMAGE_CACHE, MAX_IMAGE_ITEMS);
      }
      return response;
    })
    .catch(() => null);
  
  // Return cached immediately if available
  if (cached) {
    // Check if cache is stale (older than IMAGE_CACHE_DAYS)
    const cacheDate = cached.headers.get('sw-cache-date');
    if (cacheDate) {
      const age = Date.now() - new Date(cacheDate).getTime();
      const maxAge = IMAGE_CACHE_DAYS * 24 * 60 * 60 * 1000;
      if (age > maxAge) {
        // Cache is stale, wait for network
        const fresh = await fetchPromise;
        if (fresh) return fresh;
      }
    }
    return cached;
  }
  
  // No cache, wait for network
  const response = await fetchPromise;
  if (response) return response;
  
  // Return placeholder if image fails
  return createPlaceholderResponse();
}

// API: Network first with short-term cache
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful GET API responses briefly
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      const responseToCache = response.clone();
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      await cache.put(request, new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      }));
      
      await trimCache(API_CACHE, MAX_API_ITEMS);
    }
    
    return response;
  } catch (error) {
    // Try cache for offline support
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline JSON response
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Static assets: Cache first
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Dynamic content: Network first with cache fallback
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      await trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS);
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 404 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Trim cache to max items (LRU-style)
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

// Create placeholder response for failed images
function createPlaceholderResponse() {
  const svg = `
    <svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e3a5f" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#ffffff80" font-family="system-ui" font-size="14">
        Image unavailable
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventoryChanges());
  }
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSalesData());
  }
});

async function syncInventoryChanges() {
  // Get pending changes from IndexedDB
  // Future implementation
  console.log('[SW] Syncing inventory changes...');
}

async function syncSalesData() {
  console.log('[SW] Syncing sales data...');
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'CardLedger',
    body: 'You have a new notification',
    icon: '/logo-icon.jpg',
    badge: '/logo-icon.jpg',
    tag: 'cardledger-notification',
    data: {},
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle action buttons
  if (event.action) {
    handleNotificationAction(event.action, event.notification.data);
    return;
  }
  
  // Default: open app
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

function handleNotificationAction(action, data) {
  console.log('[SW] Notification action:', action, data);
  
  switch (action) {
    case 'view-card':
      clients.openWindow(`/inventory/${data.cardId}`);
      break;
    case 'dismiss':
      // Just close notification (already done)
      break;
    default:
      clients.openWindow('/');
  }
}

// ============================================
// MESSAGE HANDLING
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map(key => caches.delete(key)));
      })
    );
  }
  
  if (event.data.type === 'CACHE_IMAGES') {
    event.waitUntil(cacheImages(event.data.urls));
  }
});

// Pre-cache a list of image URLs
async function cacheImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (e) {
      console.warn('[SW] Failed to cache image:', url);
    }
  }
}

console.log('[SW] Service Worker v2 loaded');
