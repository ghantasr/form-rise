const CACHE = 'formrise-v6';

let isUpdate = false;

// Install: track whether this is an update (existing SW was active) or a fresh install
self.addEventListener('install', () => {
  isUpdate = Boolean(self.registration.active);
  self.skipWaiting();
});

// Activate: remove old caches, claim clients, notify open tabs if this is an update
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        if (!isUpdate) return;
        return self.clients
          .matchAll({ includeUncontrolled: true, type: 'window' })
          .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })));
      })
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Form data (GET /api/forms/:slug): stale-while-revalidate so the form loads
  // offline after being visited at least once online.
  if (url.pathname.match(/^\/api\/forms\/[^/]+$/) && !url.pathname.endsWith('/responses')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached ?? new Response(
            JSON.stringify({ error: 'Form not available offline. Open this form once while online first.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          ));
        // Serve cache immediately if available, update in background
        return cached ?? networkFetch;
      })
    );
    return;
  }

  // All other API calls: network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'You appear to be offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // Static assets with content hashes (JS/CSS bundles): cache-first
  if (url.pathname.match(/\.(js|css|woff2?|png|svg|ico)$/)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Navigation (HTML): network-first, fall back to cached shell
  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match('/').then((r) => r ?? fetch(request)))
  );
});
