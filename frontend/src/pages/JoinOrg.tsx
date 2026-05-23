import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { orgsApi } from '../api/orgs';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { Organization } from '../types/org';

function GoogleSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setError('');
      try {
        const { data } = await authApi.googleLogin(response.access_token);
        login(data.accessToken, data.user);
        onSuccess();
      } catch {
        setError('Google sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
    flow: 'implicit',
    scope: 'openid email profile',
  });

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => googleLogin()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#E4E4E0] rounded-lg bg-white hover:bg-[#F5F5F3] transition-colors text-sm font-medium text-[#1A1A18] disabled:opacity-60 cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}

export function JoinOrg() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error' | 'auth_required'>('idle');
  const [joinedOrg, setJoinedOrg] = useState<Organization | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const attemptJoin = async () => {
    if (!token) return;
    setStatus('joining');
    try {
      const { data } = await orgsApi.join(token);
      setJoinedOrg(data.org);
      setStatus('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axiosErr.response?.status === 401) {
        setStatus('auth_required');
      } else {
        setErrorMsg(axiosErr.response?.data?.error ?? 'This invite link is invalid or has expired.');
        setStatus('error');
      }
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setStatus('auth_required');
      return;
    }
    attemptJoin();
  }, [isLoading, isAuthenticated]);

  if (isLoading || status === 'idle' || status === 'joining') {
    return <PageLoader />;
  }

  if (status === 'auth_required') {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E8E8E4] rounded-xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#1B6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#1B6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#1B6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Sign in to join</h1>
            <p className="text-sm text-[#6B6B66] mb-6">
              You need to be signed in to accept this organisation invite.
            </p>
            <GoogleSignInButton onSuccess={() => attemptJoin()} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E8E8E4] rounded-xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Invalid invite</h1>
            <p className="text-sm text-[#6B6B66] mb-6">{errorMsg}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B6B4A] text-white text-sm font-medium rounded-lg hover:bg-[#134F36] transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // success
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E8E8E4] rounded-xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#1B6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A18] mb-1">You've joined!</h1>
          {joinedOrg && (
            <p className="text-base text-[#6B6B66] mb-6">
              Welcome to <span className="font-semibold text-[#1A1A18]">{joinedOrg.name}</span>
            </p>
          )}
          <Button onClick={() => navigate('/org')} className="w-full justify-center">
            Go to organisation
          </Button>
        </div>
      </div>
    </div>
  );
}
