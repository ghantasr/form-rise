import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastProvider } from './components/shared/Toast.tsx';

// When a lazy-loaded chunk 404s (stale bundle after a new deploy), reload once
// to fetch fresh index.html and the correct new bundles.
window.addEventListener('vite:preloadError', () => { window.location.reload(); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
