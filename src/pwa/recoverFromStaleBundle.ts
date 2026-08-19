// Recovery for users stuck on a stale bundle: when a dynamic import 404s
// (a chunk hash that the server no longer has because a newer deploy
// shipped a new bundle), wipe every cache and unregister every SW, then
// reload. The next page load re-registers the current SW from scratch.
//
// Lives in its own module so both the window-level handler in main.tsx
// (catches unhandled rejections / script errors) and the React
// ErrorBoundary (catches render errors) can call the same logic.

export function isStaleModuleError(message: string): boolean {
  // The browser surfaces dynamic-import failures as an Error whose message
  // starts with this prefix. Covers Chromium, Firefox and Safari.
  return /Failed to fetch dynamically imported module/i.test(message);
}

export function recoverFromStaleBundle(): void {
  void (async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Ignore ��� caches API may be unavailable.
    }
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs ?? []).map((reg) => reg.unregister()));
    } catch {
      // Ignore — serviceWorker may be unavailable.
    }
    window.location.reload();
  })();
}