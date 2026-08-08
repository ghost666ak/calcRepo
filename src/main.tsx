import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import './styles/tokens.css';
import './styles/global.css';
import './styles/app.css';

// Recovery for users stuck on a stale bundle: when a dynamic import 404s (a
// hash that the server no longer has because a newer deploy shipped a new
// bundle), wipe every cache and unregister every SW, then reload. The next
// page load re-registers the current SW from scratch.
function recoverFromStaleBundle(): void {
  void (async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Ignore — caches API may be unavailable.
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

function isStaleModuleError(message: string): boolean {
  // The browser surfaces dynamic-import failures as an Error with this prefix.
  return /Failed to fetch dynamically imported module/.test(message);
}

window.addEventListener('error', (event) => {
  const message = event.message ?? '';
  if (isStaleModuleError(message)) recoverFromStaleBundle();
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = typeof reason === 'object' && reason && 'message' in reason
    ? String((reason as { message: unknown }).message)
    : String(reason);
  if (isStaleModuleError(message)) recoverFromStaleBundle();
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();