import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { setAccessToken } from './api/client';
import { useAuthStore } from './stores/authStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/shared/LoadingSpinner';

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

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <BrowserRouter>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/f/:slug" element={<FormFill />} />
            <Route path="/f/:slug/thank-you" element={<ThankYou />} />

            {/* Public standalone page — own layout, no sidebar */}
            <Route path="/templates" element={<Templates />} />

            {/* Private pages — redirect to login if not authenticated */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
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
  );
}
