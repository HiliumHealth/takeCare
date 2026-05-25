/// Hilium PWA Service Worker
/// Handles offline caching, push notifications, and background sync

const CACHE_VERSION = 'hilium-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install (app shell)
const APP_SHELL = [
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[Hilium SW] Installing service worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Hilium SW] Pre-caching app shell assets individually');
        // Use map to cache individually so one failure doesn't stop the whole worker
        return Promise.allSettled(
          APP_SHELL.map((url) => 
            cache.add(url).catch(err => console.error(`[Hilium SW] Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[Hilium SW] Activating service worker...');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
            .map((key) => {
              console.log('[Hilium SW] Removing old cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH (Stale-While-Revalidate for pages, Cache-First for assets) ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests & dev HMR
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.includes('_next/webpack-hmr')) return;
  if (url.pathname.includes('__nextjs')) return;
  if (url.pathname.includes('webpack')) return;
  if (url.pathname.includes('hot-update')) return;

  // Skip API routes — always network (auth, data mutations, etc.)
  if (url.pathname.startsWith('/api/')) return;

  // Images: Cache-First strategy
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request)
              .then((response) => {
                if (response.ok) {
                  cache.put(request, response.clone());
                }
                return response;
              })
              .catch(() => caches.match('/icons/icon-192x192.png'))
        )
      )
    );
    return;
  }

  // Static assets (JS, CSS, fonts): Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
        )
      )
    );
    return;
  }

  // HTML pages: Network-First with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // Everything else: Network-First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── PUSH NOTIFICATIONS ────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[Hilium SW] ✓ Push event RECEIVED at', new Date().toISOString());
  console.log('[Hilium SW] Push event object:', event);
  console.log('[Hilium SW] Registration state:', self.registration.scope);

  let data = {
    title: 'Hilium Health',
    body: 'You have a new health update.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'hilium-notification',
    url: '/dashboard',
  };

  try {
    if (event.data) {
      console.log('[Hilium SW] Raw push data:', event.data);
      const payload = event.data.json();
      console.log('[Hilium SW] Parsed push payload:', payload);
      data = { ...data, ...payload };
    } else {
      console.warn('[Hilium SW] No data in push event, using defaults');
    }
  } catch (e) {
    console.error('[Hilium SW] Failed to parse JSON:', e);
    if (event.data) {
      data.body = event.data.text();
      console.log('[Hilium SW] Fallback to text data:', data.body);
    }
  }

  console.log('[Hilium SW] Final notification data:', data);

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'hilium-notification',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open Hilium', icon: '/icons/icon-96x96.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.requireInteraction || false,
  };

  console.log('[Hilium SW] Notification options:', options);
  console.log('[Hilium SW] About to call showNotification with title:', data.title);

  event.waitUntil(
    self.registration
      .showNotification(data.title, options)
      .then(() => {
        console.log('[Hilium SW] ✓ Notification shown successfully!');
      })
      .catch((error) => {
        console.error('[Hilium SW] ✗ Failed to show notification:', error);
        console.error('[Hilium SW] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      })
  );
});

// ─── NOTIFICATION CLICK ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[Hilium SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── BACKGROUND SYNC (for offline form submissions) ────────
self.addEventListener('sync', (event) => {
  console.log('[Hilium SW] Background sync:', event.tag);

  if (event.tag === 'sync-health-data') {
    event.waitUntil(syncHealthData());
  }
});

async function syncHealthData() {
  // Future: replay queued offline health record submissions
  console.log('[Hilium SW] Syncing queued health data...');
}

// ─── PERIODIC BACKGROUND SYNC ──────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'health-check-reminder') {
    event.waitUntil(sendHealthReminder());
  }
});

async function sendHealthReminder() {
  // Future: Check if user has pending health check-ins
  console.log('[Hilium SW] Periodic health reminder check');
}

// ─── MESSAGE HANDLING ──────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
