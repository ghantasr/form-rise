import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useToast } from '../components/shared/Toast';

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
      toast('OTP sent to your email', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to send OTP');
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
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-[#1B6B4A] rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span className="font-bold text-[#1A1A18] text-2xl">FormRise</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E4] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#1A1A18] mb-1">
            {step === 'email' ? 'Sign in to FormRise' : 'Enter your code'}
          </h1>
          <p className="text-sm text-[#6B6B66] mb-6">
            {step === 'email'
              ? 'Enter your email to receive a one-time code.'
              : `We sent a 6-digit code to ${email}`}
          </p>

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
                <div className="flex-1 h-px bg-[#E8E8E4]" />
                <span className="text-xs text-[#9C9C96]">or continue with email</span>
                <div className="flex-1 h-px bg-[#E8E8E4]" />
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
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] text-center cursor-pointer"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-[#9C9C96] mt-6">
          No password needed. No spam. Just forms.
        </p>
      </div>
    </div>
  );
}
