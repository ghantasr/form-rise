import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useToast } from '../components/shared/Toast';

const features = [
  { icon: '⚡', text: 'Build forms in minutes with a drag-and-drop editor' },
  { icon: '📊', text: 'Real-time responses with charts and exports' },
  { icon: '📱', text: 'Share via link, QR code, or embed anywhere' },
];

export function Login() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const { data } = await authApi.googleLogin(idToken);
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setStep('otp');
      toast('Code sent to your email', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(email, code);
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="login-left-panel flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0C1910 0%, #1B6B4A 100%)' }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4h6v4H9V4z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-xl tracking-[-0.02em]">formrise</span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-[-0.03em] mb-4">
              Forms people<br />actually fill out.
            </h1>
            <p className="text-white/55 text-base leading-relaxed">
              A no-code form builder for teams who care about data quality and response rates.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0" style={{ fontSize: '16px', lineHeight: 1 }}>
                  {f.icon}
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs">© 2026 formrise.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F5F4F1]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 justify-center mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#1B6B4A] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4h6v4H9V4z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-[#141412] text-xl tracking-[-0.02em]">formrise</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E4E0] shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-[22px] font-bold text-[#141412] leading-tight tracking-[-0.02em] mb-1">
                {step === 'email' ? 'Welcome back' : 'Check your email'}
              </h1>
              <p className="text-sm text-[#6B6B66]">
                {step === 'email'
                  ? 'Sign in to your formrise account.'
                  : `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {step === 'email' && (
              <div className="mb-5">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={({ credential }) => credential && handleGoogleSuccess(credential)}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    width="320"
                    text="continue_with"
                    shape="rectangular"
                    theme="outline"
                  />
                </div>
                {googleLoading && (
                  <p className="text-xs text-center text-[#6B6B66] mt-2">Signing in...</p>
                )}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#E4E4E0]" />
                  <span className="text-xs text-[#9C9C96]">or continue with email</span>
                  <div className="flex-1 h-px bg-[#E4E4E0]" />
                </div>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4" noValidate>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  error={error}
                />
                <Button type="submit" isLoading={loading} size="lg" className="w-full justify-center">
                  Send code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <Input
                  label="One-time code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  error={error}
                />
                <Button type="submit" isLoading={loading} size="lg" className="w-full justify-center">
                  Verify & sign in
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="text-sm text-[#6B6B66] hover:text-[#141412] text-center cursor-pointer transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            )}
          </div>

          <p className="text-xs text-center text-[#9C9C96] mt-5">
            No password. No spam. Just forms.
          </p>
        </div>
      </div>
    </div>
  );
}
