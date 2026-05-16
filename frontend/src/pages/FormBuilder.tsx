import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Send, Check, Loader2, QrCode } from 'lucide-react';
import { formsApi } from '../api/forms';
import { useFormStore } from '../stores/formStore';
import { useToast } from '../components/shared/Toast';
import { Button } from '../components/shared/Button';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { FieldPicker } from '../components/builder/FieldPicker';
import { FormCanvas } from '../components/builder/FormCanvas';
import { FieldEditor } from '../components/builder/FieldEditor';
import { PublishModal } from '../components/builder/PublishModal';
import { QrShareModal } from '../components/qr/QrShareModal';
import type { FieldType, FormField } from '../types/form';

export function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    form,
    fields,
    selectedFieldId,
    isDirty,
    isSaving,
    setForm,
    setTitle,
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

  useEffect(() => {
    if (!isDirty || !form?.id) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await formsApi.update(form.id!, {
          title: form.title,
          description: form.description,
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
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 bg-white border-b border-[#E8E8E4] z-10 flex-shrink-0">
        <input
          type="text"
          value={form?.title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-sm sm:text-base font-semibold text-[#1A1A18] bg-transparent outline-none border-b border-transparent
            hover:border-[#E8E8E4] focus:border-[#1B6B4A] transition-colors px-1 py-0.5 min-w-0"
          placeholder="Untitled Form"
        />

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B6B66] flex-shrink-0">
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : !isDirty ? (
            <Check size={12} className="text-[#1B6B4A]" />
          ) : null}
          <span>{saveStatusLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/f/${form?.slug}`, '_blank')}
            disabled={!form?.slug}
            className="hidden sm:flex"
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setQrModalOpen(true)}
            disabled={!form?.id || form?.status !== 'active'}
            title={form?.status !== 'active' ? 'Publish the form first to generate QR codes' : ''}
            className="hidden sm:flex"
          >
            <QrCode size={14} />
            QR Codes
          </Button>
          <Button size="sm" onClick={handlePublish}>
            <Send size={14} />
            <span className="hidden sm:inline">Publish</span>
          </Button>
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
      <div className="flex flex-1 overflow-hidden">
        <div className={`${mobilePanel === 'fields' ? 'flex' : 'hidden'} lg:flex`}>
          <FieldPicker onAdd={(type: FieldType) => { addField(type); setMobilePanel('canvas'); }} />
        </div>

        <div className={`${mobilePanel === 'canvas' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1`}>
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelect={(fieldId) => { selectField(fieldId); setMobilePanel('editor'); }}
            onDelete={(fieldId) => removeField(fieldId)}
            onReorder={(oldIndex, newIndex) => reorderFields(oldIndex, newIndex)}
          />
        </div>

        <div className={`${mobilePanel === 'editor' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-none`}>
          {selectedField ? (
            <FieldEditor
              field={selectedField}
              onChange={(updates: Partial<FormField>) => updateField(selectedField.id, updates)}
            />
          ) : (
            <div className="lg:hidden flex-1 flex items-center justify-center text-sm text-[#6B6B66] p-8 text-center">
              Select a field from the Canvas tab to edit it.
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
