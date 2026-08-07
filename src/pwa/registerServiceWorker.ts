import type { CacheLevel } from '../core/types';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        // Push the user's current cache-level preference to the active worker
        // so it can apply the right strategy without waiting for the next boot.
        try {
          const raw = window.localStorage.getItem('calcRepo.preferences.v1');
          const level: CacheLevel =
            raw && /"cacheLevel":"(shell|assets|extended)"/.test(raw)
              ? (raw.match(/"cacheLevel":"(shell|assets|extended)"/)?.[1] as CacheLevel)
              : 'assets';
          if (registration.active) {
            registration.active.postMessage({ type: 'SET_CACHE_LEVEL', level });
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            const pushLevel = () => {
              if (newWorker.state === 'activated') {
                newWorker.postMessage({ type: 'SET_CACHE_LEVEL', level });
              }
            };
            newWorker.addEventListener('statechange', pushLevel);
          });
        } catch {
          // Preferences are unavailable; the worker will use its default.
        }
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}