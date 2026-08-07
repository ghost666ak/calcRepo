/// <reference lib="webworker" />

// calcRepo service worker.
// Strategy: cache-first for same-origin static assets, network-first for navigations,
// fall back to the cached index.html for offline app-shell boot.

const VERSION = 'calcrepo-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './public/manifest.webmanifest',
  './public/favicon.svg',
  './public/pwa/icon.svg',
  './public/pwa/icon-maskable.svg',
  './public/pwa/icon-192.png',
  './public/pwa/icon-512.png',
  './public/pwa/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isAppShellRequest(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname === '/' ||
      url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('/manifest.webmanifest') ||
      url.pathname.startsWith('/public/') ||
      url.pathname.startsWith('/assets/'))
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./'))),
    );
    return;
  }

  if (!isAppShellRequest(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('./index.html'));
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});