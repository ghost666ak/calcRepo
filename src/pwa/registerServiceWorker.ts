import type { CacheLevel } from '../core/types';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  const postCacheLevel = (registration: ServiceWorkerRegistration): void => {
    try {
      const raw = window.localStorage.getItem('calcRepo.preferences.v1');
      const level: CacheLevel =
        raw && /"cacheLevel":"(shell|assets|extended)"/.test(raw)
          ? (raw.match(/"cacheLevel":"(shell|assets|extended)"/)?.[1] as CacheLevel)
          : 'assets';
      const target = registration.active ?? registration.waiting ?? registration.installing;
      target?.postMessage({ type: 'SET_CACHE_LEVEL', level });
    } catch {
      // Preferences unavailable; the worker will use its default.
    }
  };

  const wireUpdateListener = (registration: ServiceWorkerRegistration): void => {
    // If a new worker has installed and is waiting, tell it to take over now.
    // skipWaiting() + clients.claim() in the SW make this safe; we then reload
    // so the page runs the bundle that matches the active SW.
    const onStateChange = (): void => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          installing.postMessage('SKIP_WAITING');
        }
      });
    };
    onStateChange();

    // When a new SW takes control of this page, reload once so the new bundle
    // (whose hash is referenced by the freshly-cached index.html) actually runs.
    // Without this the old JS keeps handling user actions even though the new
    // SW is now in charge.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  };

  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        postCacheLevel(registration);
        wireUpdateListener(registration);

        // Ask the browser to re-check for an updated SW on every page load.
        // Without this the browser only checks in the background (and only
        // when the previous SW is more than 24h old), so a freshly-deployed
        // SW can sit waiting while users still run the old bundle.
        registration.update().catch(() => undefined);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          const pushLevel = (): void => {
            if (newWorker.state === 'activated') {
              newWorker.postMessage({ type: 'SET_CACHE_LEVEL', level: readCacheLevel() });
            }
          };
          newWorker.addEventListener('statechange', pushLevel);
        });
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}

function readCacheLevel(): CacheLevel {
  try {
    const raw = window.localStorage.getItem('calcRepo.preferences.v1');
    const m = raw?.match(/"cacheLevel":"(shell|assets|extended)"/);
    return (m?.[1] as CacheLevel) ?? 'assets';
  } catch {
    return 'assets';
  }
}