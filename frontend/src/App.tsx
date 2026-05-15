import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { setAccessToken } from './api/client';
import { useAuthStore } from './stores/authStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/shared/LoadingSpinner';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FormBuilder } from './pages/FormBuilder';
import { FormResponses } from './pages/FormResponses';
import { FormFill } from './pages/FormFill';
import { ThankYou } from './pages/ThankYou';
import { Templates } from './pages/Templates';
import { Settings } from './pages/Settings';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppInitializer() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        login(data.accessToken, data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useOfflineSync((count) => {
    console.info(`[FormRise] Synced ${count} offline submission(s).`);
  });

  return null;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <BrowserRouter>
      <AppInitializer />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/f/:slug" element={<FormFill />} />
        <Route path="/f/:slug/thank-you" element={<ThankYou />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/forms/new" element={<FormBuilder />} />
            <Route path="/forms/:id/edit" element={<FormBuilder />} />
            <Route path="/forms/:id/responses" element={<FormResponses />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
