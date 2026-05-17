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
import { INDIAN_LANGUAGES } from '../components/builder/TranslationEditor';
import type { Form, FormField } from '../types/form';

export function FormFill() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token') ?? undefined;
  const isPreview = searchParams.get('preview') === 'true';

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Values keyed by fieldId
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Language switcher
  const [activeLang, setActiveLang] = useState<string | null>(null);

  // Drop-off analytics
  const reachedFields = useRef<Set<string>>(new Set());

  // Email access restriction
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetch = isPreview
      ? formsApi.getPreview(slug)   // slug is actually the form ID in preview mode
      : formsApi.getPublic(slug);
    fetch
      .then(({ data }) => {
        setForm(data);
        if (!data.allowedEmails || data.allowedEmails.length === 0) {
          setEmailVerified(true);
        }
        // Detect preferred language
        if (data.enabledLanguages && data.enabledLanguages.length > 0) {
          const browserLang = navigator.language.split('-')[0];
          if (data.enabledLanguages.includes(browserLang)) {
            setActiveLang(browserLang);
          }
        }
        // Track view (only for real, non-preview fills)
        if (!isPreview) {
          formsApi.recordView(slug).catch(() => {/* silent */});
        }
      })
      .catch(() => setError(isPreview
        ? 'Could not load preview. Make sure you are signed in.'
        : 'This form is not available or does not exist.'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Track field-reach on beforeunload
  useEffect(() => {
    if (!slug || isPreview) return;
    const sendReach = () => {
      const fieldIds = Array.from(reachedFields.current);
      if (fieldIds.length === 0) return;
      navigator.sendBeacon(
        `/api/f/${slug}/analytics/field-reach`,
        JSON.stringify({ fieldIds })
      );
    };
    window.addEventListener('beforeunload', sendReach);
    return () => window.removeEventListener('beforeunload', sendReach);
  }, [slug, isPreview]);

  const handleEmailVerify = async () => {
    if (!slug || !emailInput.trim()) {
      setEmailError('Please enter your email address.');
      return;
    }
    setVerifyingEmail(true);
    setEmailError('');
    try {
      const { data } = await formsApi.verifyAccess(slug, emailInput.trim());
      if (data.allowed) {
        setEmailVerified(true);
      } else {
        setEmailError('Your email is not on the allowed list for this form.');
      }
    } catch {
      setEmailError('Failed to verify access. Please try again.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !slug) return;

    const visFields = form.fields.filter((field) => {
      if (!field.conditional?.showIf) return true;
      const { fieldId, equals } = field.conditional.showIf;
      const val = values[fieldId];
      return String(val ?? '') === equals;
    });

    const errors: Record<string, string> = {};
    for (const field of visFields) {
      const err = validateField(field, values[field.id]);
      if (err) errors[field.id] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const answers: SubmitAnswerDto[] = visFields.map((field) => {
        const val = values[field.id];
        const answer: SubmitAnswerDto = { fieldId: field.id };

        if (field.fieldType === 'checkbox') {
          answer.valuesArray = (val as string[]) ?? [];
        } else if (field.fieldType === 'rating' || field.fieldType === 'number') {
          answer.numericValue = Number(val) || undefined;
        } else {
          answer.value = val !== undefined && val !== null ? String(val) : undefined;
        }

        return answer;
      });

      if (!navigator.onLine) {
        await offlineQueue.enqueue({
          slug,
          respondentEmail: emailInput.trim() || undefined,
          qrToken,
          answers,
        });
        navigate(`/f/${slug}/thank-you`, {
          state: {
            thankYouMsg: 'Your response has been saved offline and will be submitted automatically when you reconnect.',
          },
        });
        return;
      }

      // Send field-reach analytics before navigating
      if (!isPreview) {
        const fieldIds = Array.from(reachedFields.current);
        if (fieldIds.length > 0) {
          formsApi.recordFieldReach(slug, fieldIds).catch(() => {/* silent */});
        }
      }

      await responsesApi.submit(slug, emailInput.trim() || undefined, qrToken, answers);

      navigate(`/f/${slug}/thank-you`, {
        state: { thankYouMsg: form.thankYouMsg },
      });
    } catch {
      setFieldErrors({ _submit: 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Form not found</h1>
          <p className="text-sm text-[#6B6B66]">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Translation helper — falls back to original if translation missing
  const t = (field: FormField) => {
    if (!activeLang) return field;
    const tr = field.translations?.[activeLang];
    return {
      ...field,
      label: tr?.label || field.label,
      placeholder: tr?.placeholder || field.placeholder,
      helpText: tr?.helpText || field.helpText,
      options: tr?.options?.length ? tr.options : field.options,
    };
  };

  const tForm = () => {
    if (!activeLang) return { title: form.title, description: form.description, thankYouMsg: form.thankYouMsg };
    const tr = form.translations?.[activeLang];
    return {
      title: tr?.title || form.title,
      description: tr?.description || form.description,
      thankYouMsg: tr?.thankYouMsg || form.thankYouMsg,
    };
  };

  const formText = tForm();

  const visibleFields = form.fields.filter((field) => {
    if (!field.conditional?.showIf) return true;
    const { fieldId, equals } = field.conditional.showIf;
    const val = values[fieldId];
    return String(val ?? '') === equals;
  });

  const totalFields = visibleFields.length;
  const answeredFields = visibleFields.filter((f) => {
    const v = values[f.id];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '' && v !== null;
  }).length;
  const progress = totalFields > 0 ? Math.round((answeredFields / totalFields) * 100) : 0;

  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E8E8E4] rounded-xl shadow-sm p-8 w-full max-w-md">
          <h1 className="text-xl font-bold text-[#1A1A18] mb-1">{form.title}</h1>
          <p className="text-sm text-[#6B6B66] mb-6">
            This form is restricted. Please enter your email to continue.
          </p>
          <div className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              error={emailError}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailVerify()}
            />
            <Button onClick={handleEmailVerify} isLoading={verifyingEmail}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-6 sm:py-10 px-4">
      <div className="max-w-xl mx-auto">
        {isPreview && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#FFF8E6] border border-amber-200 rounded-lg text-sm text-amber-700 mb-5">
            <span>👁 <strong>Preview mode</strong> — this form is not published yet. Submissions are disabled.</span>
            <button onClick={() => window.close()} className="text-xs font-medium underline underline-offset-2 cursor-pointer shrink-0">Close</button>
          </div>
        )}
        {qrToken && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-lg text-sm text-[#1B6B4A] mb-5">
            <span className="text-base">📷</span>
            <span>You're filling this form via a QR code. It can only be submitted once.</span>
          </div>
        )}

        {/* Language switcher */}
        {form.enabledLanguages && form.enabledLanguages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <button
              onClick={() => setActiveLang(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                activeLang === null
                  ? 'bg-[#1B6B4A] text-white border-[#1B6B4A]'
                  : 'bg-white text-[#6B6B66] border-[#E8E8E4] hover:border-[#1B6B4A]/40'
              }`}
            >
              English
            </button>
            {form.enabledLanguages.map((code) => {
              const lang = INDIAN_LANGUAGES.find((l) => l.code === code);
              return (
                <button
                  key={code}
                  onClick={() => setActiveLang(code)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    activeLang === code
                      ? 'bg-[#1B6B4A] text-white border-[#1B6B4A]'
                      : 'bg-white text-[#6B6B66] border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                  }`}
                >
                  {lang?.native ?? code}
                </button>
              );
            })}
          </div>
        )}

        {form.showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-[#6B6B66] mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-[#E8E8E4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1B6B4A] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E8E8E4] rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="h-2 bg-[#1B6B4A]" />
          <div className="px-4 py-4 sm:px-8 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A18] mb-1">{formText.title}</h1>
            {formText.description && (
              <p className="text-sm text-[#6B6B66]">{formText.description}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {visibleFields.map((field) => (
              <div
                key={field.id}
                className="bg-white border border-[#E8E8E4] rounded-xl px-4 py-4 sm:px-8 sm:py-6"
                onFocus={() => reachedFields.current.add(field.id)}
              >
                <FieldRenderer
                  field={t(field) as FormField}
                  value={values[field.id]}
                  onChange={(val) => handleChange(field.id, val)}
                  error={fieldErrors[field.id]}
                />
              </div>
            ))}
          </div>

          {fieldErrors._submit && (
            <p className="text-sm text-red-500 mt-4 text-center">{fieldErrors._submit}</p>
          )}

          <div className="mt-6">
            <Button type="submit" size="lg" isLoading={submitting} disabled={isPreview} className="w-full justify-center">
              {isPreview ? 'Submission disabled in preview' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
