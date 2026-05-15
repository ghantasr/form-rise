import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formsApi } from '../api/forms';
import { responsesApi, type SubmitAnswerDto } from '../api/responses';
import { offlineQueue } from '../stores/offlineStore';
import { validateField } from '../utils/validation';
import { FieldRenderer } from '../components/renderer/FieldRenderer';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { Form } from '../types/form';

export function FormFill() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token') ?? undefined;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Values keyed by fieldId
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Email access restriction
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  useEffect(() => {
    if (!slug) return;
    formsApi
      .getPublic(slug)
      .then(({ data }) => {
        setForm(data);
        if (!data.allowedEmails || data.allowedEmails.length === 0) {
          setEmailVerified(true);
        }
      })
      .catch(() => setError('This form is not available or does not exist.'))
      .finally(() => setLoading(false));
  }, [slug]);

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

    const errors: Record<string, string> = {};
    for (const field of form.fields) {
      const err = validateField(field, values[field.id]);
      if (err) errors[field.id] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const answers: SubmitAnswerDto[] = form.fields.map((field) => {
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

  const totalFields = form.fields.length;
  const answeredFields = form.fields.filter((f) => {
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
    <div className="min-h-screen bg-[#FAFAF8] py-10 px-4">
      <div className="max-w-xl mx-auto">
        {qrToken && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-lg text-sm text-[#1B6B4A] mb-5">
            <span className="text-base">📷</span>
            <span>You're filling this form via a QR code. It can only be submitted once.</span>
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
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-[#1A1A18] mb-1">{form.title}</h1>
            {form.description && (
              <p className="text-sm text-[#6B6B66]">{form.description}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {form.fields.map((field) => (
              <div
                key={field.id}
                className="bg-white border border-[#E8E8E4] rounded-xl px-8 py-6"
              >
                <FieldRenderer
                  field={field}
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
            <Button type="submit" size="lg" isLoading={submitting} className="w-full justify-center">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
