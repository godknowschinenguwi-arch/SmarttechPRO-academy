// SmartTech Solar Calculator — scoped service worker.
// Runtime cache (stale-while-revalidate) for the calculator's own pages and
// static assets only, so a repeat visit keeps working without a network.
const CACHE_NAME = 'smarttech-solar-v1';
const SHELL_URL = '/solar-calculator';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function inScope(pathname) {
  return pathname.startsWith('/solar-calculator') || pathname.startsWith('/_next/') || pathname === '/manifest.webmanifest';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !inScope(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || (request.mode === 'navigate' ? cache.match(SHELL_URL) : undefined));
      return cached || network;
    })
  );
});
