const CACHE_NAME = 'cinema-v12';
const IMG_CACHE = 'cinema-imgs';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './public/collections.json'
];

// Notify all open clients that a new version has been installed
function notifyClients(){
  self.clients.matchAll().then(clients => {
    clients.forEach(c => c.postMessage({ type: 'NEW_VERSION' }));
  });
}

// Page asks us to take over -> activate the new service worker now.
// IMPORTANT: we only wipe the APP caches, NOT the image cache (cinema-imgs),
// so posters stay cached and tab switches / updates stay fast.
self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'SKIP_WAITING') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k.startsWith('cinema-') && k !== IMG_CACHE).map(k => caches.delete(k)))
      ).then(() => self.skipWaiting())
    );
  }
});

// Install: cache static assets (don't fail if one asset is missing)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url =>
        fetch(url).then(r => { if (r.ok) return cache.put(url, r); }).catch(() => {})
      ))
    )
  ).then(() => notifyClients());
});

// Activate: clean old app caches, keep the image cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMG_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for data, cache-first for images & static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For data files (db.json, collections.json): network-first, fallback to cache
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For images (posters, icons): cache-first from the dedicated image cache,
  // populate it on first load. Posters survive app updates this way.
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.avif')) {
    event.respondWith(
      caches.open(IMG_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(event.request, response.clone()).catch(() => {});
            }
            return response;
          }).catch(() => caches.match('./icons/icon-192.png'));
        })
      )
    );
    return;
  }

  // For everything else: cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
