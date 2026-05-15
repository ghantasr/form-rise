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
    <div className="flex flex-col h-screen bg-[#FAFAF8] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-white border-b border-[#E8E8E4] z-10 flex-shrink-0">
        <input
          type="text"
          value={form?.title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-base font-semibold text-[#1A1A18] bg-transparent outline-none border-b border-transparent
            hover:border-[#E8E8E4] focus:border-[#1B6B4A] transition-colors px-1 py-0.5 min-w-0"
          placeholder="Untitled Form"
        />

        <div className="flex items-center gap-1.5 text-xs text-[#9C9C96] flex-shrink-0">
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : !isDirty ? (
            <Check size={12} className="text-[#1B6B4A]" />
          ) : null}
          <span>{saveStatusLabel}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/f/${form?.slug}`, '_blank')}
            disabled={!form?.slug}
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
          >
            <QrCode size={14} />
            QR Codes
          </Button>
          <Button size="sm" onClick={handlePublish}>
            <Send size={14} />
            Publish
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <FieldPicker onAdd={(type: FieldType) => addField(type)} />

        <FormCanvas
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelect={(fieldId) => selectField(fieldId)}
          onDelete={(fieldId) => removeField(fieldId)}
          onReorder={(oldIndex, newIndex) => reorderFields(oldIndex, newIndex)}
        />

        {selectedField && (
          <FieldEditor
            field={selectedField}
            onChange={(updates: Partial<FormField>) => updateField(selectedField.id, updates)}
          />
        )}
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
