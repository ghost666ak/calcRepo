import type { CacheLevel } from '../core/types';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  const postCacheLevel = (registration: ServiceWorkerRegistration): void => {
    try {
      const raw = window.localStorage.getItem('calcRepo.preferences.v1');
      const level: CacheLevel =
        raw && /"cacheLevel":"(shell|assets|extended|max)"/.test(raw)
          ? (raw.match(/"cacheLevel":"(shell|assets|extended|max)"/)?.[1] as CacheLevel)
          : 'assets';
      const target = registration.active ?? registration.waiting ?? registration.installing;
      target?.postMessage({ type: 'SET_CACHE_LEVEL', level });
    } catch {
      // Preferences unavailable; the worker will use its default.
    }
  };

  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    // IMPORTANT: register with a stable URL (no query string). Appending
    // `?v=...` looks like a cache-bust but it actually causes the browser
    // to treat every page load as a brand-new SW, which triggers an
    // install + skipWaiting + controllerchange loop that reloads the page
    // forever. The browser already re-checks sw.js byte-for-byte when
    // registration.update() is called below, so no query string is needed.
    //
    // Note: the controllerchange -> reload behaviour is owned by usePwaStatus,
    // not here, to avoid duplicate listeners causing extra reloads.
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        postCacheLevel(registration);

        // If a worker is already waiting (another tab fetched sw.js first and
        // triggered its install but never told it to take over), kick it off
        // here so this tab doesn't stay on the old bundle.
        if (registration.waiting) {
          registration.waiting.postMessage('SKIP_WAITING');
        }

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
    const m = raw?.match(/"cacheLevel":"(shell|assets|extended|max)"/);
    return (m?.[1] as CacheLevel) ?? 'assets';
  } catch {
    return 'assets';
  }
}