import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore, USER_CACHE_KEY } from './stores/authStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Chunk-load error detection
// Happens when a new deploy invalidates old hashed bundles while the app is open
// ---------------------------------------------------------------------------
function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    err.name === 'ChunkLoadError'
  );
}

// Wraps lazy() with one auto-reload on chunk error caused by a new deploy.
// Offline chunk errors are NOT retried — they surface to ErrorBoundary as-is
// so the user sees an "offline" message instead of a reload loop.
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      if (isChunkLoadError(err) && navigator.onLine && !sessionStorage.getItem('chunk_reloaded')) {
        sessionStorage.setItem('chunk_reloaded', '1');
        window.location.reload();
        return new Promise<never>(() => {}); // stays pending while reload happens
      }
      throw err;
    })
  );
}

// ---------------------------------------------------------------------------
// Error boundary — chunk errors get a friendly "new version" screen;
// other errors get the generic crash screen
// ---------------------------------------------------------------------------
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[FormRise] Uncaught error:', error, info); }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (isChunkLoadError(error)) {
      const offline = !navigator.onLine;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui', color: '#333', gap: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>{offline ? '📡' : '🔄'}</div>
          <h2 style={{ margin: 0, color: '#1A1A18' }}>
            {offline ? "You're offline" : 'New version available'}
          </h2>
          <p style={{ margin: 0, color: '#6B6B66', maxWidth: '320px' }}>
            {offline
              ? 'This page isn\'t available offline. Connect to the internet and try again.'
              : 'The app was updated. Reload to get the latest version.'}
          </p>
          <button
            onClick={() => { sessionStorage.removeItem('chunk_reloaded'); window.location.reload(); }}
            style={{ padding: '0.625rem 1.5rem', background: '#1B6B4A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
          >
            {offline ? 'Try again' : 'Reload'}
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#333' }}>
        <h2 style={{ color: '#c0392b' }}>Something went wrong</h2>
        <pre style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// Lazy page imports — all wrapped with retry-on-chunk-error
// ---------------------------------------------------------------------------
const Landing             = lazyWithRetry(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login               = lazyWithRetry(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard           = lazyWithRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FormBuilder         = lazyWithRetry(() => import('./pages/FormBuilder').then(m => ({ default: m.FormBuilder })));
const FormResponses       = lazyWithRetry(() => import('./pages/FormResponses').then(m => ({ default: m.FormResponses })));
const FormFill            = lazyWithRetry(() => import('./pages/FormFill').then(m => ({ default: m.FormFill })));
const ThankYou            = lazyWithRetry(() => import('./pages/ThankYou').then(m => ({ default: m.ThankYou })));
const Templates           = lazyWithRetry(() => import('./pages/Templates').then(m => ({ default: m.Templates })));
const Settings            = lazyWithRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const JoinOrg             = lazyWithRetry(() => import('./pages/JoinOrg').then(m => ({ default: m.JoinOrg })));
const OrgDashboard        = lazyWithRetry(() => import('./pages/OrgDashboard').then(m => ({ default: m.OrgDashboard })));
const AssignmentResults   = lazyWithRetry(() => import('./pages/AssignmentResults').then(m => ({ default: m.AssignmentResults })));
const MyResults           = lazyWithRetry(() => import('./pages/MyResults').then(m => ({ default: m.MyResults })));
const MyAssignments       = lazyWithRetry(() => import('./pages/MyAssignments').then(m => ({ default: m.MyAssignments })));
const Privacy             = lazyWithRetry(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));

const SESSION_HINT_KEY = 'fr_has_session';

function AppShell() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <AppLayout />;
  return <Outlet />;
}

function RequireAuth() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppInitializer({ onUpdateAvailable }: { onUpdateAvailable: () => void }) {
  const { login, logout, setLoading } = useAuthStore();

  // Auth bootstrap
  useEffect(() => {
    if (!localStorage.getItem(SESSION_HINT_KEY)) {
      setLoading(false);
      return;
    }

    if (!navigator.onLine) {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      if (raw) {
        try { login('', JSON.parse(raw)); } catch {}
      }
      setLoading(false);
      return;
    }

    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => login(data.accessToken, data.user))
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) logout();
      })
      .finally(() => setLoading(false));
  }, []);

  // Re-authenticate with a real token as soon as connectivity returns
  useEffect(() => {
    const handleOnline = () => {
      if (!localStorage.getItem(SESSION_HINT_KEY)) return;
      axios.post('/api/auth/refresh', {}, { withCredentials: true })
        .then(({ data }) => login(data.accessToken, data.user))
        .catch((err) => {
          if (err.response?.status === 401 || err.response?.status === 403) logout();
        });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Global unhandled rejection handler — catches chunk errors outside React render
  // Only reloads when online; offline chunk errors are suppressed (not retried).
  useEffect(() => {
    const handle = (e: PromiseRejectionEvent) => {
      if (isChunkLoadError(e.reason)) {
        e.preventDefault();
        if (navigator.onLine && !sessionStorage.getItem('chunk_reloaded')) {
          sessionStorage.setItem('chunk_reloaded', '1');
          window.location.reload();
        }
      }
    };
    // Clear the reload flag when connectivity returns so future deploys can still trigger a reload
    const clearFlag = () => sessionStorage.removeItem('chunk_reloaded');
    window.addEventListener('unhandledrejection', handle);
    window.addEventListener('online', clearFlag);
    return () => {
      window.removeEventListener('unhandledrejection', handle);
      window.removeEventListener('online', clearFlag);
    };
  }, []);

  // Service worker update notifications — show banner when a new SW activates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handle = (e: MessageEvent) => {
      if (e.data?.type === 'SW_UPDATED') onUpdateAvailable();
    };
    navigator.serviceWorker.addEventListener('message', handle);
    return () => navigator.serviceWorker.removeEventListener('message', handle);
  }, []);

  useOfflineSync((count) => {
    console.info(`[FormRise] Synced ${count} offline submission(s).`);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Update banner — shown when a new SW version activates in the background
// ---------------------------------------------------------------------------
function UpdateBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#1B6B4A', color: 'white', padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
      <span>A new version is available.</span>
      <button
        onClick={() => { sessionStorage.removeItem('chunk_reloaded'); window.location.reload(); }}
        style={{ padding: '0.25rem 0.875rem', background: 'white', color: '#1B6B4A', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
      >
        Reload
      </button>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.25rem' }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export { SESSION_HINT_KEY };

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
        <BrowserRouter>
          <AppInitializer onUpdateAvailable={() => setUpdateAvailable(true)} />
          {updateAvailable && <UpdateBanner onDismiss={() => setUpdateAvailable(false)} />}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/f/:slug" element={<FormFill />} />
              <Route path="/f/:slug/thank-you" element={<ThankYou />} />
              <Route path="/join/:token" element={<JoinOrg />} />

              <Route element={<AppShell />}>
                <Route element={<RequireAuth />}>
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/forms/new" element={<FormBuilder />} />
                  <Route path="/forms/:id/edit" element={<FormBuilder />} />
                  <Route path="/forms/:id/responses" element={<FormResponses />} />
                  <Route path="/forms/:formId/assignments/:assignmentId" element={<AssignmentResults />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/org" element={<OrgDashboard />} />
                  <Route path="/my-results" element={<MyResults />} />
                  <Route path="/my-assignments" element={<MyAssignments />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
