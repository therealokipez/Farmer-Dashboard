// ── AgroLink Service Worker v2 ────────────────────
// Uses relative paths — works on any deploy URL

const CACHE = 'agrolink-v2';

// Core assets to pre-cache
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── INSTALL ───────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Google Fonts — network first, cache fallback
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(networkFirstThenCache(e.request));
    return;
  }

  // App shell — cache first, then network
  e.respondWith(cacheFirstThenNetwork(e.request));
});

async function cacheFirstThenNetwork(req) {
  const cached = await caches.match(req);
  if (cached) {
    // Refresh in background (stale-while-revalidate)
    fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res));
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type !== 'opaque') {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone));
    }
    return res;
  } catch {
    // Offline fallback: return cached index.html for navigation
    if (req.destination === 'document') {
      return caches.match('./index.html');
    }
  }
}

async function networkFirstThenCache(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone));
    }
    return res;
  } catch {
    return caches.match(req);
  }
}
