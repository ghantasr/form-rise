import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Send, Check, Loader2, QrCode, Languages, Palette } from 'lucide-react';
import { formsApi } from '../api/forms';
import { useFormStore } from '../stores/formStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/shared/Toast';
import { Button } from '../components/shared/Button';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { FieldPicker } from '../components/builder/FieldPicker';
import { FormCanvas } from '../components/builder/FormCanvas';
import { FieldEditor } from '../components/builder/FieldEditor';
import { PublishModal } from '../components/builder/PublishModal';
import { QrShareModal } from '../components/qr/QrShareModal';
import { TranslationEditor, type TranslationPayload } from '../components/builder/TranslationEditor';
import { GuidedTour, shouldShowTour } from '../components/builder/GuidedTour';
import { OnboardingChecklist } from '../components/builder/OnboardingChecklist';
import { FORM_THEMES } from '../utils/formThemes';
import type { FieldType, Form, FormField } from '../types/form';

export function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const {
    form,
    fields,
    selectedFieldId,
    isDirty,
    isSaving,
    setForm,
    setTitle,
    setThemeId,
    addField,
    removeField,
    updateField,
    reorderFields,
    selectField,
    setSaving,
    setDirty,
    reset,
  } = useFormStore();

  const [loading, setLoading] = useState(true);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'fields' | 'canvas' | 'editor'>('canvas');
  const [showTranslations, setShowTranslations] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) {
      formsApi
        .create('Untitled Form')
        .then(({ data }) => {
          setForm(data);
          navigate(`/forms/${data.id}/edit`, { replace: true });
        })
        .catch(() => {
          toast('Failed to create form', 'error');
          navigate('/');
        })
        .finally(() => setLoading(false));
    } else {
      formsApi
        .get(id)
        .then(({ data }) => setForm(data))
        .catch(() => {
          toast('Failed to load form', 'error');
          navigate('/');
        })
        .finally(() => setLoading(false));
    }

    return () => {
      reset();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id]);

  // Show tour after load only for first-time users
  useEffect(() => {
    if (!loading && shouldShowTour()) {
      const t = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    if (!isDirty || !form?.id) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await formsApi.update(form.id!, {
          title: form.title,
          description: form.description,
          themeId: form.themeId,
          fields,
        });
        setDirty(false);
      } catch {
        toast('Failed to save changes', 'error');
      } finally {
        setSaving(false);
      }
    }, 3000);
  }, [fields, form?.title, isDirty]);

  const handlePublish = async () => {
    if (!form?.id) return;
    try {
      const { data } = await formsApi.publish(form.id);
      setPublishedSlug(data.slug);
      setPublishModalOpen(true);
      toast('Form published successfully', 'success');
    } catch {
      toast('Failed to publish form', 'error');
    }
  };

  const handleThemeChange = async (themeId: string) => {
    if (!form?.id) return;
    setThemeId(themeId);
    try {
      await formsApi.update(form.id, { themeId });
      setDirty(false);
      toast('Theme saved', 'success');
    } catch {
      toast('Failed to save theme', 'error');
    }
  };

  const handleSaveTranslations = async (payload: TranslationPayload) => {
    if (!form?.id) return;

    // Cancel any pending auto-save so it doesn't race with this write
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    try {
      // Flush any pending field/title changes first, then write translations on top.
      // Sequential order matters: update recreates field rows, translations must come after.
      await formsApi.update(form.id, {
        title: form.title,
        description: form.description,
        themeId: form.themeId,
        fields,
      });
      await formsApi.updateTranslations(form.id, payload);

      // Sync local store so future auto-saves carry the correct enabledLanguages
      setForm({ ...form, enabledLanguages: payload.enabledLanguages } as Form);
      setDirty(false);
      toast('Translations saved', 'success');
    } catch {
      toast('Failed to save translations', 'error');
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  const saveStatusLabel = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Unsaved changes'
    : 'Saved';

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border-b border-[#E8E8E4] z-10 flex-shrink-0">
        {/* Title — flex-1 grows to fill space; min-w-[72px] keeps it tappable on very narrow screens */}
        <input
          type="text"
          value={form?.title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[72px] text-sm sm:text-base font-semibold text-[#1A1A18] bg-transparent outline-none border-b border-transparent
            hover:border-[#E8E8E4] focus:border-[#1B6B4A] transition-colors px-1 py-0.5"
          placeholder="Untitled Form"
        />

        {/* Save status — desktop only */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B6B66] shrink-0">
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : !isDirty ? (
            <Check size={12} className="text-[#1B6B4A]" />
          ) : null}
          <span>{saveStatusLabel}</span>
        </div>

        {/*
          Button group: no shrink-0 here — flex can compress this wrapper when space
          is tight. The inner div uses min-width:max-content so buttons never wrap;
          overflow-x:auto on the wrapper scrolls them horizontally within their
          flex-allocated width. Works down to ~200px without clipping anything.
        */}
        <div className="min-w-0 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2" style={{ minWidth: 'max-content' }}>
            <Button
              data-tour="preview-btn"
              variant="secondary"
              size="sm"
              onClick={() => { setHasPreviewed(true); window.open(`/f/${form?.id}?preview=true`, '_blank'); }}
              disabled={!form?.id}
              title="Preview"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              disabled={!form?.id || form?.status !== 'active'}
              title={form?.status !== 'active' ? 'Publish the form first to generate QR codes' : 'QR Codes'}
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">QR Codes</span>
            </Button>
            <Button
              data-tour="style-btn"
              variant="secondary"
              size="sm"
              onClick={() => { setShowThemes((prev) => !prev); setShowTranslations(false); }}
              disabled={!form?.id}
              title="Style"
            >
              <Palette size={14} />
              <span className="hidden sm:inline">Style</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowTranslations((prev) => !prev); setShowThemes(false); }}
              disabled={!form?.id}
              title="Translations"
            >
              <Languages size={14} />
              <span className="hidden sm:inline">Translations</span>
            </Button>
            <Button data-tour="publish-btn" size="sm" onClick={handlePublish}>
              <Send size={14} />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile panel tabs */}
      <div className="lg:hidden flex border-b border-[#E8E8E4] bg-white shrink-0">
        {(['fields', 'canvas', 'editor'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors cursor-pointer ${
              mobilePanel === panel
                ? 'border-b-2 border-[#1B6B4A] text-[#1B6B4A]'
                : 'text-[#6B6B66] border-b-2 border-transparent'
            }`}
          >
            {panel === 'editor' ? 'Edit Field' : panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>

      {/* Main content — desktop: 3 columns, mobile: single panel */}
      {showThemes ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Form Style</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Choose a colour theme for your form</p>
              </div>
              <button
                onClick={() => setShowThemes(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {FORM_THEMES.map((t) => {
                const isActive = (form?.themeId ?? 'forest') === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-left focus:outline-none ${
                      isActive ? 'border-[#1B6B4A] shadow-sm' : 'border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                    }`}
                  >
                    {/* Colour preview */}
                    <div className="flex gap-1.5 items-center">
                      <div className="w-6 h-6 rounded-md shrink-0" style={{ backgroundColor: t.primary }} />
                      <div className="flex-1 h-6 rounded-md" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }} />
                      <div className="w-4 h-6 rounded-md shrink-0" style={{ backgroundColor: t.primaryLight }} />
                    </div>
                    <span className="text-xs font-medium text-[#1A1A18] leading-tight">{t.name}</span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-[#1B6B4A] uppercase tracking-wide">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : showTranslations ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Translations</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Add Indian language translations for your form</p>
              </div>
              <button
                onClick={() => setShowTranslations(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>
            {form?.id && (
              <TranslationEditor
                form={{ ...(form as Form), fields }}
                userEmail={userEmail}
                onSave={handleSaveTranslations}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div data-tour="field-picker" className={`${mobilePanel === 'fields' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-none`}>
            <FieldPicker onAdd={(type: FieldType) => { addField(type); setMobilePanel('canvas'); }} />
          </div>

          <div data-tour="form-canvas" className={`${mobilePanel === 'canvas' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1`}>
            <FormCanvas
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelect={(fieldId) => { selectField(fieldId); setMobilePanel('editor'); }}
              onDelete={(fieldId) => removeField(fieldId)}
              onReorder={(oldIndex, newIndex) => reorderFields(oldIndex, newIndex)}
            />
          </div>

          <div data-tour="field-editor" className={`${mobilePanel === 'editor' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-none`}>
            {selectedField ? (
              <FieldEditor
                field={selectedField}
                allFields={fields}
                onChange={(updates: Partial<FormField>) => updateField(selectedField.id, updates)}
              />
            ) : (
              <div className="lg:hidden flex-1 flex items-center justify-center text-sm text-[#6B6B66] p-8 text-center">
                Select a field from the Canvas tab to edit it.
              </div>
            )}
          </div>
        </div>
      )}

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        slug={publishedSlug}
      />

      {form?.id && (
        <QrShareModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          formId={form.id}
        />
      )}

      {showTour && <GuidedTour onDone={() => setShowTour(false)} onMobilePanel={setMobilePanel} />}

      <OnboardingChecklist
        hasFields={fields.length > 0}
        hasRequiredField={fields.some((f) => f.isRequired)}
        hasPreviewed={hasPreviewed}
        isPublished={form?.status === 'active'}
        onStartTour={() => {
          setShowThemes(false);
          setShowTranslations(false);
          setShowTour(true);
        }}
      />
    </div>
  );
}
