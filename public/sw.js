// CardLedger Service Worker v1.1
// Enhanced with Push Notification support
const CACHE_NAME = 'cardledger-v1';
const STATIC_CACHE = 'cardledger-static-v1';
const DYNAMIC_CACHE = 'cardledger-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo-icon.jpg',
  '/apple-touch-icon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests and external URLs
  if (url.pathname.startsWith('/api') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('googleapis') ||
      url.hostname !== location.hostname) {
    return;
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // For other requests, try cache first then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version but update in background
        fetch(request).then((response) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response);
          });
        }).catch(() => {});
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-inventory') {
    console.log('[SW] Background sync: inventory');
    // Future: sync offline changes
  }
});

// ===== Push Notification Support =====

// Handle push events from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let notificationData = {
    title: 'CardLedger',
    body: 'You have a new notification',
    icon: '/logo-icon.jpg',
    badge: '/logo-icon.jpg',
    tag: 'cardledger-notification',
    data: {},
    actions: [],
  };

  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
        actions: data.actions || [],
      };
    } catch (e) {
      // If not JSON, use text
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on notification type
  switch (notificationData.type) {
    case 'price_alert':
      targetUrl = notificationData.itemId 
        ? `/inventory?item=${notificationData.itemId}` 
        : '/alerts';
      break;
    case 'achievement':
      targetUrl = '/achievements';
      break;
    case 'daily_summary':
      targetUrl = '/dashboard';
      break;
    case 'sale_confirmation':
      targetUrl = '/sales';
      break;
    case 'market_update':
      targetUrl = '/market';
      break;
    default:
      targetUrl = notificationData.url || '/';
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Already handled by default
        break;
      case 'dismiss':
        // Just close, don't navigate
        return;
      default:
        console.log('[SW] Unknown action:', event.action);
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing CardLedger window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // No existing window, open new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  // Could track dismissals for analytics
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe and send new subscription to server
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        console.log('[SW] Re-subscribed to push');
        // In production, send newSubscription to your server
        return newSubscription;
      })
      .catch((error) => {
        console.error('[SW] Failed to re-subscribe:', error);
      })
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.1' });
  }
  
  // Handle local notification requests from the app
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/logo-icon.jpg',
      badge: options.badge || '/logo-icon.jpg',
      tag: options.tag || 'cardledger-notification',
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
    });
  }
});

console.log('[SW] Service Worker loaded v1.1');
