// ── AgroLink Service Worker ────────────────────────
// Caches all app assets for full offline support

const CACHE_NAME = 'agrolink-v1';
const ASSETS = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Google Fonts (cached on first load)
];

// ── INSTALL: cache all core assets ────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS);
    })
  );
  // Take control immediately without waiting
  self.skipWaiting();
});

// ── ACTIVATE: clean up old caches ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// ── FETCH: cache-first with network fallback ───────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For Google Fonts — network first, then cache
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request))
      )
    );
    return;
  }

  // For all other requests — cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Return cached version and update in background
        const fetchPromise = fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
          });
          return response;
        }).catch(() => cached);

        return cached;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── BACKGROUND SYNC placeholder ───────────────────
// (For future: queue price data refreshes when back online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-prices') {
    console.log('[SW] Background sync: prices');
    // TODO: fetch fresh market prices and update cache
  }
});
