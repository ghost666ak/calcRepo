import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import './styles/tokens.css';
import './styles/global.css';
import './styles/app.css';

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