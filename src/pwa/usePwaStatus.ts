import { useCallback, useEffect, useState } from 'react';

export interface CacheStats {
  readonly entries: number;
  readonly bytes: number;
}

export interface UsePwaStatusResult {
  readonly updateAvailable: boolean;
  readonly checking: boolean;
  readonly checkForUpdate: () => Promise<boolean>;
  readonly applyUpdate: () => void;
  readonly cacheStats: CacheStats | null;
  readonly refreshCacheStats: () => Promise<void>;
  readonly clearCache: () => Promise<void>;
}

/**
 * PWA lifecycle helpers used by the settings drawer.
 *
 * - Detects when a new service worker has installed and is waiting to take over.
 * - Lets the user trigger an update check at any time.
 * - Computes the current cache footprint so the user can see how much space
 *   the app shell + assets occupy.
 * - Provides a clean way to drop every cache entry (the service worker will
 *   re-install on the next reload).
 */
export function usePwaStatus(): UsePwaStatusResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
          setWaitingWorker(newWorker);
        }
      });
    };

    const onControllerChange = () => {
      // A new SW has taken over; reload so the user sees the latest code.
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
        setWaitingWorker(registration.waiting);
      }
      if (registration.installing) handleUpdateFound(registration);
      registration.addEventListener('updatefound', () => handleUpdateFound(registration));
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
    setChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;
      await registration.update();
      // Allow the updatefound listener a tick to fire if a new SW appears.
      await new Promise((resolve) => setTimeout(resolve, 250));
      return registration.waiting !== undefined && navigator.serviceWorker.controller !== null;
    } finally {
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage('SKIP_WAITING');
      return;
    }
    // If we don't know about a waiting worker, fall back to a hard reload.
    if (typeof window !== 'undefined') window.location.reload();
  }, [waitingWorker]);

  const refreshCacheStats = useCallback(async () => {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    let entries = 0;
    let bytes = 0;
    for (const key of keys) {
      const cache = await caches.open(key);
      const requests = await cache.keys();
      entries += requests.length;
      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;
        const blob = await response.clone().blob();
        bytes += blob.size;
      }
    }
    setCacheStats({ entries, bytes });
  }, []);

  const clearCache = useCallback(async () => {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      } catch {
        // Ignore: the SW may not be registered yet; nothing to update.
      }
    }
    setCacheStats({ entries: 0, bytes: 0 });
  }, []);

  useEffect(() => {
    void refreshCacheStats();
  }, [refreshCacheStats]);

  return {
    updateAvailable,
    checking,
    checkForUpdate,
    applyUpdate,
    cacheStats,
    refreshCacheStats,
    clearCache,
  };
}
