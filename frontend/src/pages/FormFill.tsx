import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { formsApi } from '../api/forms';
import { authApi } from '../api/auth';
import { responsesApi, type SubmitAnswerDto } from '../api/responses';
import { studentsApi } from '../api/orgs';
import { offlineQueue } from '../stores/offlineStore';
import { useAuthStore } from '../stores/authStore';
import { validateField } from '../utils/validation';
import { FieldRenderer } from '../components/renderer/FieldRenderer';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { ALL_LANGUAGES } from '../components/builder/TranslationEditor';
import { getTheme } from '../utils/formThemes';
import type { Form, FormField } from '../types/form';

// ── Scenario screen shared by closed / paused / date-restricted states ────────
function ScenarioScreen({
  themeVars, bg, cardBg, border, text, muted, primary, primaryLight,
  icon, title, subtitle, action,
}: {
  themeVars: React.CSSProperties;
  bg: string; cardBg: string; border: string; text: string; muted: string;
  primary: string; primaryLight: string;
  icon: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 form-themed" style={{ ...themeVars, backgroundColor: bg }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl px-8 py-10 text-center shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl" style={{ backgroundColor: primaryLight }}>
            {icon}
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: text }}>{title}</h1>
          {subtitle && <p className="text-sm leading-relaxed" style={{ color: muted }}>{subtitle}</p>}
          {action && <div className="mt-5">{action}</div>}
        </div>
        <p className="text-center text-xs mt-4" style={{ color: muted }}>
          Powered by <span className="font-semibold" style={{ color: primary }}>FormRise™</span>
        </p>
      </div>
    </div>
  );
}

// ── Format a date string for display ─────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' });
}

function SignInToAccessScreen({ slug }: { slug: string }) {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setError('');
      try {
        const { data } = await authApi.googleLogin(response.access_token);
        login(data.accessToken, data.user);
        navigate(`/f/${slug}`, { replace: true });
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
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E8E8E4] rounded-xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#1B6B4A" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#1B6B4A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Sign in to access this form</h1>
          <p className="text-sm text-[#6B6B66] mb-6">This form is restricted. Please sign in to continue.</p>
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
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function FormFill() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrToken   = searchParams.get('token') ?? undefined;
  const isPreview = searchParams.get('preview') === 'true';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [form, setForm]             = useState<Form | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [values, setValues]         = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeLang, setActiveLang] = useState<string | null>(null);

  // Email restriction gate
  const [emailInput, setEmailInput]       = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError]       = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Inline email collection (collectEmail without allowedEmails gate)
  const [collectEmailValue, setCollectEmailValue] = useState('');
  const [collectEmailError, setCollectEmailError] = useState('');

  // Offline awareness
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const reachedFields = useRef<Set<string>>(new Set());
  const fieldRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    const fetch = isPreview ? formsApi.getPreview(slug) : formsApi.getPublic(slug);
    fetch
      .then(({ data }) => {
        setForm(data);
        if (!data.allowedEmails?.length) setEmailVerified(true);
        if (data.enabledLanguages?.length) {
          const browserLang = navigator.language.split('-')[0];
          setActiveLang(
            data.enabledLanguages.includes(browserLang)
              ? browserLang
              : data.enabledLanguages[0]
          );
        }
        if (!isPreview) formsApi.recordView(slug).catch(() => {});
      })
      .catch(() => setError(isPreview
        ? 'Could not load preview. Make sure you are signed in.'
        : 'This form is not available or does not exist.'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Check if the logged-in user has already submitted this quiz under an attempt_once assignment
  useEffect(() => {
    if (!form?.isQuizMode || !isAuthenticated || isPreview) return;
    studentsApi.getMyAssignments()
      .then(({ data }) => {
        const match = data.find((a) => a.formSlug === slug && a.mode === 'attempt_once' && a.hasSubmitted);
        if (match) setAlreadySubmitted(true);
      })
      .catch(() => {});
  }, [form?.isQuizMode, slug, isAuthenticated, isPreview]);

  useEffect(() => {
    if (!slug || isPreview) return;
    const sendReach = () => {
      const ids = Array.from(reachedFields.current);
      if (ids.length) navigator.sendBeacon(`/api/f/${slug}/analytics/field-reach`, new Blob([JSON.stringify({ fieldIds: ids })], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', sendReach);
    return () => window.removeEventListener('beforeunload', sendReach);
  }, [slug, isPreview]);

  const handleEmailVerify = async () => {
    if (!slug || !emailInput.trim()) { setEmailError('Please enter your email address.'); return; }
    setVerifyingEmail(true); setEmailError('');
    try {
      const { data } = await formsApi.verifyAccess(slug, emailInput.trim());
      if (data.allowed) setEmailVerified(true);
      else setEmailError('Your email is not on the allowed list for this form.');
    } catch { setEmailError('Failed to verify access. Please try again.'); }
    finally { setVerifyingEmail(false); }
  };

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldId]; return n; });
    }
  };

  const computeVisible = (vals: Record<string, unknown>, fields: FormField[]) =>
    fields.filter((f) => {
      if (!f.conditional?.showIf) return true;
      const { fieldId, equals } = f.conditional.showIf;
      return String(vals[fieldId] ?? '') === equals;
    });

  const translateField = (field: FormField): FormField => {
    if (!activeLang) return field;
    const tr = field.translations?.[activeLang];
    let options = field.options;
    if (tr?.options?.length) {
      if (field.fieldType === 'picture_choice') {
        // Preserve the |imageUrl suffix from the original option
        options = tr.options.map((lbl, i) => {
          const orig = field.options?.[i] ?? '';
          const p = orig.indexOf('|');
          return `${lbl}|${p === -1 ? '' : orig.slice(p + 1)}`;
        });
      } else {
        // radio / checkbox / dropdown — plain label replacement
        options = tr.options;
      }
    }
    return { ...field, label: tr?.label || field.label, placeholder: tr?.placeholder || field.placeholder, helpText: tr?.helpText || field.helpText, options };
  };

  const getFormText = (f: Form) => {
    if (!activeLang) return { title: f.title, description: f.description, thankYouMsg: f.thankYouMsg };
    const tr = (f.translations as Record<string, { title?: string; description?: string; thankYouMsg?: string }>)?.[activeLang];
    return { title: tr?.title || f.title, description: tr?.description || f.description, thankYouMsg: tr?.thankYouMsg || f.thankYouMsg };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !slug) return;

    const visibleFields = computeVisible(values, form.fields);
    const errors: Record<string, string> = {};

    // Validate inline email collection
    const showEmailCapture = form.collectEmail && !form.allowedEmails?.length;
    if (showEmailCapture && !collectEmailValue.trim()) {
      setCollectEmailError('Please enter your email address.');
      return;
    }
    if (showEmailCapture && collectEmailValue.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collectEmailValue.trim())) {
      setCollectEmailError('Please enter a valid email address.');
      return;
    }

    // Validate all visible fields
    for (const field of visibleFields) {
      const err = validateField(field, values[field.id]);
      if (err) errors[field.id] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorId = visibleFields.find((f) => errors[f.id])?.id;
      if (firstErrorId && fieldRefs.current[firstErrorId]) {
        fieldRefs.current[firstErrorId]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const answers: SubmitAnswerDto[] = visibleFields.map((field) => {
        const val = values[field.id];
        const a: SubmitAnswerDto = { fieldId: field.id };
        if (field.fieldType === 'checkbox') a.valuesArray = (val as string[]) ?? [];
        else if (['rating', 'number', 'nps'].includes(field.fieldType)) a.numericValue = (val != null && val !== '') ? Number(val) : undefined;
        else a.value = val != null ? String(val) : undefined;
        return a;
      });

      const respondentEmail = emailInput.trim() || collectEmailValue.trim() || undefined;

      if (!navigator.onLine) {
        await offlineQueue.enqueue({ slug, respondentEmail, qrToken, answers });
        navigate(`/f/${slug}/thank-you`, { state: { thankYouMsg: 'Saved offline — will submit when you reconnect.' } });
        return;
      }
      const ids = Array.from(reachedFields.current);
      if (ids.length) formsApi.recordFieldReach(slug, ids).catch(() => {});
      const { data: submitResult } = await responsesApi.submit(slug, respondentEmail, qrToken, answers);
      const thankYouMsg = getFormText(form).thankYouMsg;
      if (form.isQuizMode && submitResult.totalScore !== undefined) {
        navigate(`/f/${slug}/thank-you`, {
          state: {
            thankYouMsg,
            quizResult: {
              totalScore: submitResult.totalScore,
              maxScore: submitResult.maxScore,
              isPassed: submitResult.isPassed,
              passMark: form.passMark,
              answers: submitResult.answers,
              fields: form.fields,
            },
          },
        });
      } else {
        navigate(`/f/${slug}/thank-you`, { state: { thankYouMsg } });
      }
    } catch {
      setFieldErrors({ _submit: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading || isAuthLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Form not found</h1>
          <p className="text-sm text-[#6B6B66]">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Access guard: non-public forms require sign-in
  if (!isPreview && form.accessMode && form.accessMode !== 'public' && !isAuthenticated) {
    return <SignInToAccessScreen slug={slug!} />;
  }

  const theme = getTheme(form.themeId);
  const themeVars = {
    '--f-primary': theme.primary, '--f-primary-light': theme.primaryLight,
    '--f-primary-dark': theme.primaryDark, '--f-bg': theme.bg,
    '--f-card-bg': theme.cardBg, '--f-text': theme.text,
    '--f-muted': theme.muted, '--f-border': theme.border,
  } as React.CSSProperties;

  const scenarioProps = {
    themeVars, bg: theme.bg, cardBg: theme.cardBg, border: theme.border,
    text: theme.text, muted: theme.muted, primary: theme.primary, primaryLight: theme.primaryLight,
  };

  // ── Scenario: already submitted (attempt_once) ───────────────────────────
  if (!isPreview && alreadySubmitted) {
    return (
      <ScenarioScreen {...scenarioProps}
        icon="✅"
        title="Already submitted"
        subtitle="You've already completed this quiz. Only one attempt is allowed."
        action={<a href="/my-results" className="mt-4 inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>View my results</a>}
      />
    );
  }

  // ── Scenario: form is closed ──────────────────────────────────────────────
  if (!isPreview && form.status === 'closed') {
    return (
      <ScenarioScreen {...scenarioProps}
        icon="🔒"
        title="This form is closed"
        subtitle="This form is no longer accepting new responses."
      />
    );
  }

  // ── Scenario: form is paused ──────────────────────────────────────────────
  if (!isPreview && form.status === 'paused') {
    return (
      <ScenarioScreen {...scenarioProps}
        icon="⏸️"
        title="Temporarily paused"
        subtitle="This form is not accepting responses right now. Please check back later or contact the form owner."
      />
    );
  }

  // ── Scenario: acceptFrom window not yet open ──────────────────────────────
  if (!isPreview && form.acceptFrom && new Date() < new Date(form.acceptFrom)) {
    return (
      <ScenarioScreen {...scenarioProps}
        icon="🕐"
        title="Coming soon"
        subtitle={`This form will open on ${fmtDate(form.acceptFrom)}.`}
      />
    );
  }

  // ── Scenario: acceptUntil window has passed ───────────────────────────────
  if (!isPreview && form.acceptUntil && new Date() > new Date(form.acceptUntil)) {
    return (
      <ScenarioScreen {...scenarioProps}
        icon="📅"
        title="Submissions closed"
        subtitle={`This form stopped accepting responses on ${fmtDate(form.acceptUntil)}.`}
      />
    );
  }

  // ── Scenario: email gate ──────────────────────────────────────────────────
  if (!emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 form-themed" style={{ ...themeVars, backgroundColor: theme.bg }}>
        <div className="w-full max-w-md rounded-2xl shadow-sm p-8" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          <div className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center text-xl" style={{ backgroundColor: theme.primaryLight }}>
            ✉️
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: theme.text }}>{form.title}</h1>
          <p className="text-sm mb-6" style={{ color: theme.muted }}>This form is restricted. Enter your email to verify access.</p>
          <div className="flex flex-col gap-4">
            <Input label="Email address" type="email" value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com" error={emailError}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailVerify()} />
            <Button onClick={handleEmailVerify} isLoading={verifyingEmail}>Continue →</Button>
          </div>
        </div>
      </div>
    );
  }

  const visibleFields = computeVisible(values, form.fields);
  const formText = getFormText(form);
  const showEmailCapture = form.collectEmail && !form.allowedEmails?.length;

  const answeredCount = visibleFields.filter((f) => {
    const v = values[f.id];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== null;
  }).length;
  const progress = visibleFields.length > 0 ? Math.round((answeredCount / visibleFields.length) * 100) : 0;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 form-themed" style={{ ...themeVars, backgroundColor: theme.bg }}>
      <div className="max-w-xl mx-auto flex flex-col gap-4 pb-28 sm:pb-8">

        {/* ── Banners ─────────────────────────────────────────────────── */}
        {isOffline && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-700 border border-amber-200">
            <span className="shrink-0">📡</span>
            <span>You're offline — your response will be saved and submitted automatically when you reconnect.</span>
          </div>
        )}

        {isPreview && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span>👁 <strong>Preview mode</strong> — submissions are disabled.</span>
            <button onClick={() => window.close()} className="text-xs font-medium underline cursor-pointer shrink-0">Close</button>
          </div>
        )}

        {qrToken && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: theme.primaryLight, color: theme.primary, border: `1px solid ${theme.border}` }}>
            <span>📷</span>
            <span>You're filling this form via a QR code. It can only be submitted once.</span>
          </div>
        )}

        {/* ── Language switcher ────────────────────────────────────────── */}
        {(form.enabledLanguages?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {[{ code: null as string | null, label: 'English' },
              ...form.enabledLanguages!.map((code) => ({
                code,
                label: ALL_LANGUAGES.find((l) => l.code === code)?.native ?? code,
              }))
            ].map(({ code, label }) => (
              <button
                key={code ?? 'en'}
                onClick={() => setActiveLang(code)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer shrink-0 touch-manipulation"
                style={activeLang === code
                  ? { backgroundColor: theme.primary, color: 'white', borderColor: theme.primary }
                  : { backgroundColor: theme.cardBg, color: theme.muted, borderColor: theme.border }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Form header card ─────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          <div className="h-1.5" style={{ backgroundColor: theme.primary }} />
          <div className="px-5 sm:px-7 py-5">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: theme.text }}>{formText.title}</h1>
            {activeLang && formText.title !== form.title && (
              <p className="text-sm mt-0.5 mb-1" style={{ color: theme.muted }}>{form.title}</p>
            )}
            {formText.description && <p className="text-sm mt-2 mb-3 leading-relaxed" style={{ color: theme.muted }}>{formText.description}</p>}
            {activeLang && form.description && form.description !== formText.description && (
              <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.muted, opacity: 0.75 }}>{form.description}</p>
            )}
            {form.showProgress && (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5 mt-1" style={{ color: theme.muted }}>
                  <span>{answeredCount} of {visibleFields.length} answered</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: theme.primary }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Fields ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3.5">

            {/* Inline email capture (collectEmail without allowedEmails gate) */}
            {showEmailCapture && (
              <div
                className="rounded-2xl px-5 sm:px-7 py-5"
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1.5px solid ${collectEmailError ? '#fca5a5' : theme.border}`,
                  boxShadow: collectEmailError ? '0 0 0 3px #fee2e2' : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <label className="text-base font-semibold leading-snug block mb-0.5" style={{ color: theme.text }}>
                  Email address <span className="text-red-500">*</span>
                </label>
                <p className="text-sm mb-3" style={{ color: theme.muted }}>Required to submit this form</p>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={collectEmailValue}
                  placeholder="you@example.com"
                  onChange={(e) => { setCollectEmailValue(e.target.value); setCollectEmailError(''); }}
                  className="w-full px-3 py-3 border rounded-xl text-sm outline-none transition-colors focus:ring-1"
                  style={collectEmailError
                    ? { borderColor: '#fca5a5', color: theme.text, backgroundColor: theme.cardBg }
                    : { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardBg }
                  }
                />
                {collectEmailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1.5 mt-1.5">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-[10px] font-bold flex items-center justify-center shrink-0">!</span>
                    {collectEmailError}
                  </p>
                )}
              </div>
            )}

            {/* Form fields */}
            {visibleFields.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                <p className="text-sm" style={{ color: theme.muted }}>No questions to answer — just hit Submit below.</p>
              </div>
            ) : (
              visibleFields.map((field, i) => {
                const translated = translateField(field);
                const hasError = !!fieldErrors[field.id];
                const isBilingual = !!activeLang;
                const altLabel = isBilingual && translated.label !== field.label ? field.label : undefined;
                const altHelpText = isBilingual && translated.helpText && translated.helpText !== field.helpText ? field.helpText : undefined;
                const altOptions = isBilingual && translated.options?.length
                  ? field.options?.map((opt) => { const p = opt.indexOf('|'); return p === -1 ? opt : opt.slice(0, p); })
                  : undefined;
                return (
                  <div
                    key={field.id}
                    ref={(el) => { fieldRefs.current[field.id] = el; }}
                    className={`rounded-2xl px-5 sm:px-7 py-5 transition-all ${hasError ? 'field-shake' : 'step-forward'}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: `1.5px solid ${hasError ? '#fca5a5' : theme.border}`,
                      boxShadow: hasError ? '0 0 0 3px #fee2e2' : '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onFocus={() => reachedFields.current.add(field.id)}
                  >
                    <FieldRenderer
                      field={translated}
                      value={values[field.id]}
                      onChange={(val) => handleChange(field.id, val)}
                      error={fieldErrors[field.id]}
                      primary={theme.primary}
                      primaryLight={theme.primaryLight}
                      autoFocus={i === 0}
                      altLabel={altLabel}
                      altHelpText={altHelpText}
                      altOptions={altOptions}
                    />
                  </div>
                );
              })
            )}
          </div>

          {fieldErrors._submit && (
            <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              <span className="shrink-0">⚠️</span>
              <span>{fieldErrors._submit}</span>
            </div>
          )}

          {/* Desktop submit — visible inline */}
          <div className="hidden sm:block mt-5">
            <Button
              type="submit"
              size="lg"
              isLoading={submitting}
              disabled={isPreview}
              className="w-full justify-center"
              style={{ backgroundColor: theme.primary, borderColor: theme.primary } as React.CSSProperties}
            >
              {isPreview ? '— Preview mode —' : form.isQuizMode ? 'Submit quiz' : 'Submit form'}
            </Button>
          </div>
        </form>

      </div>

      {/* Mobile submit — fixed at bottom so it's always reachable */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pt-3 pb-7 z-20 border-t"
        style={{ backgroundColor: theme.bg, borderColor: theme.border }}
      >
        <Button
          type="submit"
          size="lg"
          isLoading={submitting}
          disabled={isPreview}
          className="w-full justify-center"
          onClick={!isPreview ? (e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } : undefined}
          style={{ backgroundColor: theme.primary, borderColor: theme.primary } as React.CSSProperties}
        >
          {isPreview ? '— Preview mode —' : form.isQuizMode ? 'Submit quiz' : 'Submit form'}
        </Button>
      </div>
    </div>
  );
}
