import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Form, FormField, FormTranslations, FieldTranslations } from '../../types/form';
import { Button } from '../shared/Button';

export const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi',     native: 'हिंदी'       },
  { code: 'te', name: 'Telugu',    native: 'తెలుగు'      },
  { code: 'ta', name: 'Tamil',     native: 'தமிழ்'       },
  { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ'       },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം'     },
  { code: 'mr', name: 'Marathi',   native: 'मराठी'       },
  { code: 'bn', name: 'Bengali',   native: 'বাংলা'       },
  { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી'    },
  { code: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ'     },
  { code: 'ur', name: 'Urdu',      native: 'اردو'        },
];

export interface TranslationPayload {
  enabledLanguages: string[];
  formTranslations: FormTranslations;
  fieldTranslations: Record<string, FieldTranslations>;
}

interface TranslationEditorProps {
  form: Form;
  onSave: (data: TranslationPayload) => Promise<void>;
}

const NO_PLACEHOLDER_TYPES = new Set(['checkbox', 'radio', 'dropdown', 'date', 'rating', 'nps']);
const HAS_OPTIONS_TYPES = new Set(['dropdown', 'radio', 'checkbox', 'picture_choice']);

export function TranslationEditor({ form, onSave }: TranslationEditorProps) {
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(form.enabledLanguages ?? []);
  const [selectedLang, setSelectedLang] = useState<string | null>(
    (form.enabledLanguages ?? []).length > 0 ? (form.enabledLanguages ?? [])[0] : null
  );
  const [formTranslations, setFormTranslations] = useState<FormTranslations>(
    (form.translations as FormTranslations) ?? {}
  );
  const [fieldTranslations, setFieldTranslations] = useState<Record<string, FieldTranslations>>(() => {
    const result: Record<string, FieldTranslations> = {};
    for (const field of form.fields) {
      result[field.id] = (field.translations as FieldTranslations) ?? {};
    }
    return result;
  });
  const [saving, setSaving] = useState(false);

  const toggleLanguage = (code: string) => {
    setEnabledLanguages((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      if (!next.includes(selectedLang ?? '')) {
        setSelectedLang(next.length > 0 ? next[0] : null);
      }
      return next;
    });
  };

  const updateFormTranslation = (lang: string, key: keyof FormTranslations[string], value: string) => {
    setFormTranslations((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value },
    }));
  };

  const updateFieldTranslation = (
    fieldId: string,
    lang: string,
    key: keyof FieldTranslations[string],
    value: string
  ) => {
    setFieldTranslations((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [lang]: { ...(prev[fieldId]?.[lang] ?? {}), [key]: value },
      },
    }));
  };

  const updateFieldOptionTranslation = (
    fieldId: string,
    lang: string,
    index: number,
    value: string
  ) => {
    setFieldTranslations((prev) => {
      const existingOptions: string[] = (prev[fieldId]?.[lang]?.options as string[] | undefined) ?? [];
      const newOptions = [...existingOptions];
      newOptions[index] = value;
      return {
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          [lang]: { ...(prev[fieldId]?.[lang] ?? {}), options: newOptions },
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ enabledLanguages, formTranslations, fieldTranslations });
    } finally {
      setSaving(false);
    }
  };

  const getFieldOptionTranslation = (field: FormField, lang: string, index: number): string => {
    const opts = fieldTranslations[field.id]?.[lang]?.options as string[] | undefined;
    return opts?.[index] ?? '';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Enabled languages chips */}
      <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
        <p className="text-sm font-semibold text-[#1A1A18] mb-3">Enabled languages</p>
        <p className="text-xs text-[#6B6B66] mb-4">
          Select the languages you want to support. Respondents can switch between English and these languages.
        </p>
        <div className="flex flex-wrap gap-2">
          {INDIAN_LANGUAGES.map((lang) => {
            const isEnabled = enabledLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                  isEnabled
                    ? 'bg-[#E8F5EE] border-[#1B6B4A] text-[#1B6B4A]'
                    : 'bg-white border-[#E8E8E4] text-[#6B6B66] hover:border-[#1B6B4A]/40 hover:text-[#1A1A18]'
                }`}
              >
                {isEnabled && <Check size={12} />}
                <span>{lang.native}</span>
                <span className="text-xs opacity-70">({lang.name})</span>
              </button>
            );
          })}
        </div>
      </div>

      {enabledLanguages.length > 0 && (
        <>
          {/* Language tabs */}
          <div className="flex items-center gap-1 border-b border-[#E8E8E4]">
            {enabledLanguages.map((code) => {
              const lang = INDIAN_LANGUAGES.find((l) => l.code === code);
              return (
                <button
                  key={code}
                  onClick={() => setSelectedLang(code)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
                    selectedLang === code
                      ? 'border-[#1B6B4A] text-[#1B6B4A]'
                      : 'border-transparent text-[#6B6B66] hover:text-[#1A1A18]'
                  }`}
                >
                  {lang?.native ?? code}
                </button>
              );
            })}
          </div>

          {selectedLang && (
            <div className="flex flex-col gap-4">
              {/* Form-level translations */}
              <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
                <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-4">Form</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1A1A18]">Title</label>
                    <p className="text-xs text-[#6B6B66] mb-1">Original: {form.title}</p>
                    <input
                      type="text"
                      value={formTranslations[selectedLang]?.title ?? ''}
                      onChange={(e) => updateFormTranslation(selectedLang, 'title', e.target.value)}
                      placeholder={`Title in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                      className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                        placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1A1A18]">Description</label>
                    {form.description && (
                      <p className="text-xs text-[#6B6B66] mb-1">Original: {form.description}</p>
                    )}
                    <input
                      type="text"
                      value={formTranslations[selectedLang]?.description ?? ''}
                      onChange={(e) => updateFormTranslation(selectedLang, 'description', e.target.value)}
                      placeholder={`Description in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                      className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                        placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1A1A18]">Thank you message</label>
                    <p className="text-xs text-[#6B6B66] mb-1">Original: {form.thankYouMsg}</p>
                    <input
                      type="text"
                      value={formTranslations[selectedLang]?.thankYouMsg ?? ''}
                      onChange={(e) => updateFormTranslation(selectedLang, 'thankYouMsg', e.target.value)}
                      placeholder={`Thank you message in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                      className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                        placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                    />
                  </div>
                </div>
              </div>

              {/* Per-field translations */}
              {form.fields.map((field, index) => (
                <div key={field.id} className="bg-white border border-[#E8E8E4] rounded-xl p-5">
                  <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-4">
                    Field {index + 1}: {field.label}
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#1A1A18]">Label</label>
                      <p className="text-xs text-[#6B6B66] mb-1">Original: {field.label}</p>
                      <input
                        type="text"
                        value={(fieldTranslations[field.id]?.[selectedLang]?.label as string | undefined) ?? ''}
                        onChange={(e) => updateFieldTranslation(field.id, selectedLang, 'label', e.target.value)}
                        placeholder={`Label in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                        className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                          placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                      />
                    </div>

                    {!NO_PLACEHOLDER_TYPES.has(field.fieldType) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#1A1A18]">Placeholder</label>
                        {field.placeholder && (
                          <p className="text-xs text-[#6B6B66] mb-1">Original: {field.placeholder}</p>
                        )}
                        <input
                          type="text"
                          value={(fieldTranslations[field.id]?.[selectedLang]?.placeholder as string | undefined) ?? ''}
                          onChange={(e) => updateFieldTranslation(field.id, selectedLang, 'placeholder', e.target.value)}
                          placeholder={`Placeholder in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                          className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                            placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#1A1A18]">Help text</label>
                      {field.helpText && (
                        <p className="text-xs text-[#6B6B66] mb-1">Original: {field.helpText}</p>
                      )}
                      <input
                        type="text"
                        value={(fieldTranslations[field.id]?.[selectedLang]?.helpText as string | undefined) ?? ''}
                        onChange={(e) => updateFieldTranslation(field.id, selectedLang, 'helpText', e.target.value)}
                        placeholder={`Help text in ${INDIAN_LANGUAGES.find((l) => l.code === selectedLang)?.name}`}
                        className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                          placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                      />
                    </div>

                    {HAS_OPTIONS_TYPES.has(field.fieldType) && (field.options ?? []).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#1A1A18]">Options</label>
                        {(field.options ?? []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-[#6B6B66] w-24 truncate shrink-0">{opt}</span>
                            <input
                              type="text"
                              value={getFieldOptionTranslation(field, selectedLang, i)}
                              onChange={(e) => updateFieldOptionTranslation(field.id, selectedLang, i, e.target.value)}
                              placeholder={`Option ${i + 1} translation`}
                              className="flex-1 px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                                placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving}>
          Save translations
        </Button>
      </div>
    </div>
  );
}
