import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formsApi } from '../api/forms';
import { responsesApi, type SubmitAnswerDto } from '../api/responses';
import { offlineQueue } from '../stores/offlineStore';
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
  icon, title, subtitle,
}: {
  themeVars: React.CSSProperties;
  bg: string; cardBg: string; border: string; text: string; muted: string;
  primary: string; primaryLight: string;
  icon: string; title: string; subtitle?: string;
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

export function FormFill() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrToken   = searchParams.get('token') ?? undefined;
  const isPreview = searchParams.get('preview') === 'true';

  const [form, setForm]             = useState<Form | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
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
    if (tr?.options?.length && field.fieldType === 'picture_choice') {
      options = tr.options.map((lbl, i) => {
        const orig = field.options?.[i] ?? '';
        const p = orig.indexOf('|');
        return `${lbl}|${p === -1 ? '' : orig.slice(p + 1)}`;
      });
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
      await responsesApi.submit(slug, respondentEmail, qrToken, answers);
      navigate(`/f/${slug}/thank-you`, { state: { thankYouMsg: getFormText(form).thankYouMsg } });
    } catch {
      setFieldErrors({ _submit: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Form not available</h1>
          <p className="text-sm text-[#6B6B66]">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

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
              {isPreview ? '— Preview mode —' : 'Submit form'}
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
          {isPreview ? '— Preview mode —' : 'Submit form'}
        </Button>
      </div>
    </div>
  );
}
