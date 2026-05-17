import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { setAccessToken } from './api/client';
import { useAuthStore } from './stores/authStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/shared/LoadingSpinner';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[FormRise] Uncaught error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#333' }}>
          <h2 style={{ color: '#c0392b' }}>Something went wrong</h2>
          <pre style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
            {(this.state.error as Error).message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Landing      = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login        = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FormBuilder  = lazy(() => import('./pages/FormBuilder').then(m => ({ default: m.FormBuilder })));
const FormResponses = lazy(() => import('./pages/FormResponses').then(m => ({ default: m.FormResponses })));
const FormFill     = lazy(() => import('./pages/FormFill').then(m => ({ default: m.FormFill })));
const ThankYou     = lazy(() => import('./pages/ThankYou').then(m => ({ default: m.ThankYou })));
const Templates    = lazy(() => import('./pages/Templates').then(m => ({ default: m.Templates })));
const Settings     = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const SESSION_HINT_KEY = 'fr_has_session';

// Single shell for all "app" routes — renders AppLayout (with sidebar) for
// authenticated users, or a bare Outlet (no sidebar) for public routes.
function AppShell() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <AppLayout />;
  return <Outlet />;
}

// Auth guard used inside AppShell — AppLayout is already mounted by AppShell
// so this just blocks access without re-mounting any layout.
function RequireAuth() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}


function AppInitializer() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    // Only attempt refresh if we've previously stored a session hint.
    // This prevents a guaranteed-to-fail 401 on every public page load.
    if (!localStorage.getItem(SESSION_HINT_KEY)) {
      setLoading(false);
      return;
    }
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        login(data.accessToken, data.user);
        localStorage.setItem(SESSION_HINT_KEY, '1');
      })
      .catch(() => {
        localStorage.removeItem(SESSION_HINT_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  useOfflineSync((count) => {
    console.info(`[FormRise] Synced ${count} offline submission(s).`);
  });

  return null;
}

export { SESSION_HINT_KEY };

export default function App() {
  return (
    <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <BrowserRouter>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/f/:slug" element={<FormFill />} />
            <Route path="/f/:slug/thank-you" element={<ThankYou />} />

            {/* All app routes share one AppShell (= one AppLayout instance).
                Templates is public; the rest require auth via RequireAuth. */}
            <Route element={<AppShell />}>
              <Route path="/templates" element={<Templates />} />
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/forms/new" element={<FormBuilder />} />
                <Route path="/forms/:id/edit" element={<FormBuilder />} />
                <Route path="/forms/:id/responses" element={<FormResponses />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
