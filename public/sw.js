/// <reference lib="webworker" />

// calcRepo service worker.
// Strategy depends on the user's chosen cache level (default: "assets").
//   - "shell"    — only install-time app shell. No runtime caching.
//   - "assets"   — cache-first for app shell + same-origin assets, network-first for navigations.
//   - "extended" — assets + cache the most recent navigation response for offline boot.

const VERSION = 'calcrepo-v5';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './pwa/icon.svg',
  './pwa/icon-maskable.svg',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
  './pwa/icon-maskable-512.png',
];

let cacheLevel = 'assets';

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

function isAppShellAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/public/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('/manifest.webmanifest') ||
      url.pathname.endsWith('/favicon.svg') ||
      url.pathname.endsWith('/icon.svg') ||
      url.pathname.endsWith('/icon-maskable.svg'))
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // "shell" level: do not intercept anything except the install-time shell
  // (which is served from cache anyway via APP_SHELL precache).
  if (cacheLevel === 'shell') return;

  if (request.mode === 'navigate') {
    if (cacheLevel === 'extended') {
      // Cache the latest navigation response so offline boots have something fresh.
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
    // "assets" level: network-first navigations, fall back to cached shell.
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./'))),
    );
    return;
  }

  if (!isAppShellAsset(url)) return;

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
        .catch(() => caches.match('./index.html')),
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && typeof event.data === 'object' && event.data.type === 'SET_CACHE_LEVEL') {
    if (event.data.level === 'shell' || event.data.level === 'assets' || event.data.level === 'extended') {
      cacheLevel = event.data.level;
    }
  }
});