import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import {
  isStaleModuleError,
  recoverFromStaleBundle,
} from './pwa/recoverFromStaleBundle';
import './styles/tokens.css';
import './styles/global.css';
import './styles/app.css';

window.addEventListener('error', (event) => {
  const message = event.message ?? '';
  if (isStaleModuleError(message)) recoverFromStaleBundle();
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    typeof reason === 'object' && reason && 'message' in reason
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