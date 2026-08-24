/// <reference lib="webworker" />

// calcRepo service worker.
// Strategy depends on the user's chosen cache level (default: "assets").
//   - "shell"    — only install-time app shell. No runtime caching.
//   - "assets"   — cache-first for app shell + same-origin assets, network-first for navigations.
//   - "extended" — assets + cache the most recent navigation response for offline boot.
//   - "max"      — cache-first for every same-origin GET; offline boot works
//                  for the whole site once the install-time precache has run.
//
// At install (and on upgrade to "max"), we precache the app shell plus every
// <script src>/<link href> found in index.html, so the hashed JS/CSS chunks
// are guaranteed to be present offline after one online visit.

const VERSION = 'calcrepo-v26';
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
  // PWA shortcut icons referenced from the web app manifest. The OS pulls
  // these during install / launch, so they need to be present offline too.
  './pwa/shortcut-basic.svg',
  './pwa/shortcut-scientific.svg',
  './pwa/shortcut-base.svg',
  './pwa/shortcut-programmer.svg',
  './pwa/shortcut-tools.svg',
  './pwa/shortcut-settings.svg',
];

let cacheLevel = 'assets';

// Pull every <script src> and <link href> out of the HTML so we can precache
// the actual hashed chunks at install time. Without this, the SW only
// precaches the static shell (icons + html); the JS/CSS chunks are only
// written to RUNTIME_CACHE after a successful online fetch, which means
// the first offline visit after install or after a deploy fails because
// the new chunk hashes have never been seen.
function extractAssetUrls(html) {
  const urls = new Set();
  const scriptRe = /<script\b[^>]*?\bsrc=["']([^"']+)["']/g;
  const linkRe = /<link\b[^>]*?\bhref=["']([^"']+)["']/g;
  let m;
  while ((m = scriptRe.exec(html))) urls.add(m[1]);
  while ((m = linkRe.exec(html))) urls.add(m[1]);
  return Array.from(urls);
}

// Pull every "src" out of the web app manifest (icons / shortcuts /
// screenshots). Anything referenced there must be precached too, otherwise
// the OS installer / launcher fetches them at a moment when the network may
// not be available. Naive but tolerant: matches any "src" string in the
// JSON; ignores cross-origin entries via sameOriginUrl below.
function extractManifestUrls(manifestJson) {
  const urls = new Set();
  const srcRe = /"src"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = srcRe.exec(manifestJson))) urls.add(m[1]);
  return Array.from(urls);
}

function sameOriginUrl(href) {
  try {
    const u = new URL(href, self.location.href);
    return u.origin === self.location.origin ? u.href : null;
  } catch {
    return null;
  }
}

async function precacheBuildManifest(cache) {
  // The build emits precache-manifest.json (scripts/generate-precache-manifest.mjs):
  // every shipped file with its relative path. Trusting this list means we
  // precache absolutely everything (assets/, pwa/, index.html, manifest, …)
  // without parsing index.html or the web app manifest. If the build script
  // hasn't run, fall through to the runtime-discovery path.
  try {
    const manifestUrl = new URL('./precache-manifest.json', self.location.href).href;
    const response = await fetch(manifestUrl, { cache: 'reload' });
    if (!response || !response.ok) return false;
    const json = await response.json();
    const entries = Array.isArray(json?.files) ? json.files : [];
    const urls = entries
      .map((e) => (e && typeof e.path === 'string' ? `./${e.path}` : null))
      .filter((u) => u !== null)
      .map(sameOriginUrl)
      .filter((u) => u !== null);
    await Promise.all(urls.map((u) => cache.add(u).catch(() => undefined)));
    return urls.length > 0;
  } catch {
    return false;
  }
}

async function precacheDiscoveredAssets(cache) {
  // Always bypass the HTTP cache so we get the current build's chunk hashes,
  // even if a stale index.html is sitting in the SW cache.
  const indexResponse = await fetch(new URL('./index.html', self.location.href).href, {
    cache: 'reload',
  });
  if (!indexResponse || !indexResponse.ok) return;
  const html = await indexResponse.text();
  // Cache the fresh index.html so the offline navigation fallback has it.
  await cache.put(new URL('./index.html', self.location.href).href, indexResponse.clone()).catch(() => undefined);
  const htmlUrls = extractAssetUrls(html)
    .map(sameOriginUrl)
    .filter((u) => u !== null);

  // Also pull assets referenced by the web app manifest. Skip the manifest
  // itself (it's already in APP_SHELL) and any entries that 404 (e.g. a
  // screenshot asset that hasn't been generated yet).
  let manifestUrls = [];
  try {
    const manifestUrl = new URL('./manifest.webmanifest', self.location.href).href;
    const manifestResponse = await fetch(manifestUrl, { cache: 'reload' });
    if (manifestResponse && manifestResponse.ok) {
      const text = await manifestResponse.text();
      manifestUrls = extractManifestUrls(text)
        .map(sameOriginUrl)
        .filter((u) => u !== null && u !== manifestUrl);
    }
  } catch {
    // Manifest unavailable; ignore — runtime caching will pick up missing icons.
  }

  const urls = Array.from(new Set([...htmlUrls, ...manifestUrls]));
  if (urls.length === 0) return;
  // addAll aborts on the first failure; we want partial success so a missing
  // chunk (e.g. mid-deploy) doesn't block the rest of the shell.
  await Promise.all(
    urls.map((u) => cache.add(u).catch(() => undefined)),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL).catch(() => undefined);
        // Build-time manifest is the authoritative precache list; runtime
        // discovery stays as a fallback for the case where the manifest
        // wasn't generated (e.g. local dev, mid-deploy).
        const usedBuildManifest = await precacheBuildManifest(cache).catch(() => false);
        if (!usedBuildManifest) {
          await precacheDiscoveredAssets(cache).catch(() => undefined);
        }
      })
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
      .then(() => {
        // Enable navigation preload so the first navigation can race the
        // SW boot. Browsers without it (older Safari) ignore the call.
        if ('navigationPreload' in self.registration) {
          return self.registration.navigationPreload.enable();
        }
        return undefined;
      })
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

  if (cacheLevel === 'max') {
    // Cache-first for every same-origin GET. Once the user has loaded the
    // app at least once online, every page and asset is reachable offline
    // permanently (until the VERSION bumps, at which point one online load
    // re-warms the cache).
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // For navigations, also race the navigation preload response so
          // a faster fresh copy wins when the SW cache is stale. preload
          // returns a Response or undefined; undefined falls through to
          // the cached copy.
          if (request.mode === 'navigate' && event.preloadResponse) {
            return Promise.race([
              cached,
              event.preloadResponse.then((preloaded) => preloaded || cached),
            ]);
          }
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const copy = response.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => undefined);
              return response;
            }
            // Server doesn't have this hash anymore — evict any cached copy
            // (in either bucket) so the next reload can fall back to the
            // bundled index.html rather than looping on a missing chunk.
            // Keep index.html in cache; it's the navigation fallback.
            if (response && response.status === 404) {
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.delete(request))
                .catch(() => undefined);
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.delete(request))
                .catch(() => undefined);
            }
            return response;
          })
          .catch(() => {
            // Offline fallback: serve the last good HTML for navigations,
            // and for asset misses try cached index.html (the SPA shell)
            // before falling back to a synthetic 504. Returning the shell
            // lets the React app recover via its own error boundary /
            // stale-bundle recovery, instead of leaving a blank page.
            if (request.mode === 'navigate') {
              return caches
                .match('./index.html')
                .then((hit) => hit || caches.match('./'));
            }
            return caches
              .match('./index.html')
              .then(
                (shell) =>
                  shell ||
                  new Response('', { status: 504, statusText: 'Offline' }),
              );
          });
      }),
    );
    return;
  }

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
    // Race the navigation preload response so the SW boot doesn't delay TTFB.
    event.respondWith(
      Promise.race([
        event.preloadResponse ? event.preloadResponse : fetch(request).catch(() => undefined),
        fetch(request).catch(() => undefined),
      ]).then(
        (response) =>
          response ||
          caches.match('./index.html').then((cached) => cached || caches.match('./')),
      ),
    );
    return;
  }

  if (!isAppShellAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Stale-while-revalidate: serve cached immediately, refresh in the
        // background. If the cached entry turns out to be stale (server has a
        // newer hash that no longer exists), the background fetch will fail
        // and we drop the bad entry on the next activation cycle.
        fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
            } else if (response && response.status === 404) {
              // Server doesn't have this hash anymore — evict the stale copy
              // so we don't keep serving a broken bundle.
              caches.open(STATIC_CACHE).then((cache) => cache.delete(request)).catch(() => undefined);
            }
          })
          .catch(() => undefined);
        return cached;
      }
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
  if (event.data && typeof event.data === 'object' && event.data.type === 'SET_CACHE_LEVEL') {
    if (
      event.data.level === 'shell' ||
      event.data.level === 'assets' ||
      event.data.level === 'extended' ||
      event.data.level === 'max'
    ) {
      cacheLevel = event.data.level;
      // When switching up to "max", eagerly pull the app shell + every
      // chunk index.html references into the static cache so the next boot
      // works even before the user has navigated. addAll/add are no-ops for
      // entries already present, so it's safe to call every time the level
      // message arrives.
      if (cacheLevel === 'max') {
        caches
          .open(STATIC_CACHE)
          .then(async (cache) => {
            await cache.addAll(APP_SHELL).catch(() => undefined);
            const usedBuildManifest = await precacheBuildManifest(cache).catch(() => false);
            if (!usedBuildManifest) {
              await precacheDiscoveredAssets(cache).catch(() => undefined);
            }
          });
      }
    }
  }
});