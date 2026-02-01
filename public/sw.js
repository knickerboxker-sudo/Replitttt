// client/public/sw.js
// Cache version - increment this when static assets change to invalidate old caches
const CACHE_NAME = 'recallguard-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/');
          return new Response('Offline', { status: 503 });
        })
      )
  );
});

// ─── PUSH (server sends a push message → show a notification) ───────────────
self.addEventListener('push', (event) => {
  // Fallback if the server sends an empty payload
  let payload = { title: 'RecallGuard Alert', body: 'A new recall may affect your items.' };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      // If it's not JSON, treat as plain text body
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'recallguard-alert',         // collapses duplicate notifications
    requireInteraction: payload.urgency === 'HIGH',  // keeps HIGH alerts visible until tapped
    data: {
      url: payload.url || '/',                        // where to open on tap
      timestamp: Date.now()
    },
    actions: [
      { action: 'view', title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ─── NOTIFICATION CLICK (user taps the notification) ────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If the user tapped "Dismiss", do nothing else
  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If the app is already open, focus it and navigate
      for (const client of clients) {
        if (client.url && new URL(client.url).origin === self.location.origin) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
