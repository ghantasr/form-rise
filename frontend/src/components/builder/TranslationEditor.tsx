import { useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import type { Form, FormField, FormTranslations, FieldTranslations } from '../../types/form';
import { Button } from '../shared/Button';

interface Language { code: string; name: string; native: string; group: string; }

export const ALL_LANGUAGES: Language[] = [
  // Indian
  { code: 'hi', name: 'Hindi',       native: 'हिंदी',           group: 'Indian' },
  { code: 'te', name: 'Telugu',      native: 'తెలుగు',          group: 'Indian' },
  { code: 'ta', name: 'Tamil',       native: 'தமிழ்',           group: 'Indian' },
  { code: 'kn', name: 'Kannada',     native: 'ಕನ್ನಡ',           group: 'Indian' },
  { code: 'ml', name: 'Malayalam',   native: 'മലയാളം',          group: 'Indian' },
  { code: 'mr', name: 'Marathi',     native: 'मराठी',           group: 'Indian' },
  { code: 'bn', name: 'Bengali',     native: 'বাংলা',           group: 'Indian' },
  { code: 'gu', name: 'Gujarati',    native: 'ગુજરાતી',         group: 'Indian' },
  { code: 'pa', name: 'Punjabi',     native: 'ਪੰਜਾਬੀ',          group: 'Indian' },
  { code: 'ur', name: 'Urdu',        native: 'اردو',             group: 'Indian' },
  { code: 'or', name: 'Odia',        native: 'ଓଡ଼ିଆ',            group: 'Indian' },
  { code: 'as', name: 'Assamese',    native: 'অসমীয়া',         group: 'Indian' },
  { code: 'sa', name: 'Sanskrit',    native: 'संस्कृतम्',       group: 'Indian' },
  // European
  { code: 'fr', name: 'French',      native: 'Français',         group: 'European' },
  { code: 'de', name: 'German',      native: 'Deutsch',          group: 'European' },
  { code: 'es', name: 'Spanish',     native: 'Español',          group: 'European' },
  { code: 'pt', name: 'Portuguese',  native: 'Português',        group: 'European' },
  { code: 'it', name: 'Italian',     native: 'Italiano',         group: 'European' },
  { code: 'nl', name: 'Dutch',       native: 'Nederlands',       group: 'European' },
  { code: 'el', name: 'Greek',       native: 'Ελληνικά',         group: 'European' },
  { code: 'pl', name: 'Polish',      native: 'Polski',           group: 'European' },
  { code: 'sv', name: 'Swedish',     native: 'Svenska',          group: 'European' },
  { code: 'ro', name: 'Romanian',    native: 'Română',           group: 'European' },
  { code: 'cs', name: 'Czech',       native: 'Čeština',          group: 'European' },
  { code: 'hu', name: 'Hungarian',   native: 'Magyar',           group: 'European' },
  { code: 'fi', name: 'Finnish',     native: 'Suomi',            group: 'European' },
  { code: 'da', name: 'Danish',      native: 'Dansk',            group: 'European' },
  { code: 'no', name: 'Norwegian',   native: 'Norsk',            group: 'European' },
  // Slavic
  { code: 'ru', name: 'Russian',     native: 'Русский',          group: 'Slavic' },
  { code: 'uk', name: 'Ukrainian',   native: 'Українська',       group: 'Slavic' },
  { code: 'sr', name: 'Serbian',     native: 'Српски',           group: 'Slavic' },
  { code: 'bg', name: 'Bulgarian',   native: 'Български',        group: 'Slavic' },
  { code: 'hr', name: 'Croatian',    native: 'Hrvatski',         group: 'Slavic' },
  { code: 'sk', name: 'Slovak',      native: 'Slovenčina',       group: 'Slavic' },
  // Middle East
  { code: 'ar', name: 'Arabic',      native: 'العربية',          group: 'Middle East' },
  { code: 'tr', name: 'Turkish',     native: 'Türkçe',           group: 'Middle East' },
  { code: 'fa', name: 'Persian',     native: 'فارسی',            group: 'Middle East' },
  { code: 'he', name: 'Hebrew',      native: 'עברית',            group: 'Middle East' },
  { code: 'ku', name: 'Kurdish',     native: 'Kurdî',            group: 'Middle East' },
  // African
  { code: 'sw', name: 'Swahili',     native: 'Kiswahili',        group: 'African' },
  { code: 'am', name: 'Amharic',     native: 'አማርኛ',            group: 'African' },
  { code: 'yo', name: 'Yoruba',      native: 'Yorùbá',           group: 'African' },
  { code: 'ha', name: 'Hausa',       native: 'Hausa',            group: 'African' },
  { code: 'zu', name: 'Zulu',        native: 'isiZulu',          group: 'African' },
  { code: 'af', name: 'Afrikaans',   native: 'Afrikaans',        group: 'African' },
  // East Asian
  { code: 'zh', name: 'Chinese',     native: '中文',              group: 'East Asian' },
  { code: 'ja', name: 'Japanese',    native: '日本語',            group: 'East Asian' },
  { code: 'ko', name: 'Korean',      native: '한국어',            group: 'East Asian' },
  { code: 'mn', name: 'Mongolian',   native: 'Монгол',           group: 'East Asian' },
  // Southeast Asian
  { code: 'id', name: 'Indonesian',  native: 'Bahasa Indonesia', group: 'Southeast Asian' },
  { code: 'ms', name: 'Malay',       native: 'Bahasa Melayu',    group: 'Southeast Asian' },
  { code: 'vi', name: 'Vietnamese',  native: 'Tiếng Việt',       group: 'Southeast Asian' },
  { code: 'th', name: 'Thai',        native: 'ภาษาไทย',          group: 'Southeast Asian' },
  { code: 'tl', name: 'Filipino',    native: 'Filipino',         group: 'Southeast Asian' },
  { code: 'my', name: 'Burmese',     native: 'မြန်မာဘာသာ',      group: 'Southeast Asian' },
  { code: 'km', name: 'Khmer',       native: 'ភាសាខ្មែរ',        group: 'Southeast Asian' },
  // South Asian
  { code: 'si', name: 'Sinhala',     native: 'සිංහල',            group: 'South Asian' },
  { code: 'ne', name: 'Nepali',      native: 'नेपाली',           group: 'South Asian' },
  { code: 'dz', name: 'Dzongkha',    native: 'རྫོང་ཁ',            group: 'South Asian' },
];


export interface TranslationPayload {
  enabledLanguages: string[];
  formTranslations: FormTranslations;
  fieldTranslations: Record<string, FieldTranslations>;
}

interface TranslationEditorProps {
  form: Form;
  userEmail: string;
  onSave: (data: TranslationPayload) => Promise<void>;
}

const NO_PLACEHOLDER_TYPES = new Set(['checkbox', 'radio', 'dropdown', 'date', 'rating', 'nps']);
const HAS_OPTIONS_TYPES    = new Set(['dropdown', 'radio', 'checkbox', 'picture_choice']);

async function translateText(text: string, langCode: string, userEmail: string): Promise<string> {
  if (!text.trim()) return text;
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(
      // de= user email gives 10,000 words/day per account instead of 500 words/day per IP
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}&de=${encodeURIComponent(userEmail)}`,
      { signal: controller.signal }
    );
    clearTimeout(tid);
    const data = await res.json();
    if (data.responseStatus !== 200) return text;
    return (data.responseData?.translatedText as string) || text;
  } catch {
    return text;
  }
}

export function TranslationEditor({ form, userEmail, onSave }: TranslationEditorProps) {
  // Single selected language — null means none chosen
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
  const [saving, setSaving]           = useState(false);
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [langError, setLangError]     = useState(false);
  const [langSearch, setLangSearch]   = useState('');

  const isTranslating = (code: string) => !!translating[code];

  const autoTranslate = async (langCode: string) => {
    setTranslating((p) => ({ ...p, [langCode]: true }));
    try {
      // Collect all strings to translate
      const formTexts: Record<string, string> = {
        title:       form.title,
        description: form.description ?? '',
        thankYouMsg: form.thankYouMsg,
      };

      // Translate form-level texts in parallel
      const [tTitle, tDesc, tThanks] = await Promise.all([
        translateText(formTexts.title, langCode, userEmail),
        formTexts.description ? translateText(formTexts.description, langCode, userEmail) : Promise.resolve(''),
        translateText(formTexts.thankYouMsg, langCode, userEmail),
      ]);

      setFormTranslations((prev) => ({
        ...prev,
        [langCode]: { title: tTitle, description: tDesc, thankYouMsg: tThanks },
      }));

      // Translate fields one at a time — state update after each field shows live progress.
      for (const field of form.fields) {
        await new Promise((r) => setTimeout(r, 200));
        const tLabel = await translateText(field.label, langCode, userEmail);
        const tPlaceholder = field.placeholder ? await translateText(field.placeholder, langCode, userEmail) : '';
        const tHelp = field.helpText ? await translateText(field.helpText, langCode, userEmail) : '';

        let tOptions: string[] | undefined;
        if (HAS_OPTIONS_TYPES.has(field.fieldType) && (field.options ?? []).length > 0) {
          tOptions = [];
          for (const opt of field.options ?? []) {
            const pipeIdx = opt.indexOf('|');
            const label = pipeIdx === -1 ? opt : opt.slice(0, pipeIdx);
            tOptions.push(await translateText(label, langCode, userEmail));
          }
        }

        setFieldTranslations((prev) => ({
          ...prev,
          [field.id]: {
            ...(prev[field.id] ?? {}),
            [langCode]: {
              label:       tLabel,
              placeholder: tPlaceholder || undefined,
              helpText:    tHelp || undefined,
              options:     tOptions,
            },
          },
        }));
      }
    } finally {
      setTranslating((p) => ({ ...p, [langCode]: false }));
    }
  };

  const selectLanguage = (code: string) => {
    setLangError(false);
    if (selectedLang === code) {
      // Clicking the active language deselects it
      setSelectedLang(null);
      return;
    }
    setSelectedLang(code);
    // Auto-translate if no existing translation for this language
    if (!formTranslations[code]?.title) {
      autoTranslate(code);
    }
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

  const updateFieldOptionTranslation = (fieldId: string, lang: string, index: number, value: string) => {
    setFieldTranslations((prev) => {
      const existing: string[] = (prev[fieldId]?.[lang]?.options as string[] | undefined) ?? [];
      const next = [...existing];
      next[index] = value;
      return {
        ...prev,
        [fieldId]: { ...prev[fieldId], [lang]: { ...(prev[fieldId]?.[lang] ?? {}), options: next } },
      };
    });
  };

  const getFieldOptionTranslation = (field: FormField, lang: string, index: number): string => {
    const opts = fieldTranslations[field.id]?.[lang]?.options as string[] | undefined;
    return opts?.[index] ?? '';
  };

  const handleSave = async () => {
    if (!selectedLang) {
      setLangError(true);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        enabledLanguages: [selectedLang],
        formTranslations,
        fieldTranslations,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]';

  return (
    <div className="flex flex-col gap-6">

      {/* Language selector — single select */}
      <div className="bg-white border border-[#E8E8E4] rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-sm font-semibold text-[#1A1A18] mb-1">Translation language</p>
          <p className="text-xs text-[#6B6B66]">
            Choose one language — all fields will be auto-translated. Click the selected language to remove it.
          </p>
        </div>

        {langError && (
          <div className="mx-5 mb-3 text-sm text-red-500 flex items-center gap-1.5">
            <span className="inline-flex w-4 h-4 rounded-full bg-red-100 text-red-500 text-[10px] font-bold items-center justify-center shrink-0">!</span>
            Please select a language before saving.
          </div>
        )}

        {/* Search input */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66] pointer-events-none" />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full pl-8 pr-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
            />
            {langSearch && (
              <button onClick={() => setLangSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B66] hover:text-[#1A1A18] cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Grouped language list */}
        <div className="max-h-56 overflow-y-auto border-t border-[#F0F0EC]">
          {(() => {
            const q = langSearch.toLowerCase();
            const filtered = ALL_LANGUAGES.filter(
              (l) => !q || l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q)
            );
            const groups = [...new Set(filtered.map((l) => l.group))];
            if (filtered.length === 0) {
              return <p className="text-sm text-[#6B6B66] text-center py-6">No languages match "{langSearch}"</p>;
            }
            return groups.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-[#9B9B96] uppercase tracking-wider px-5 py-2 bg-[#FAFAF8]">{group}</p>
                {filtered.filter((l) => l.group === group).map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  const isLoading  = isTranslating(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => selectLanguage(lang.code)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                      style={{ backgroundColor: isSelected ? '#E8F5EE' : undefined }}
                    >
                      {/* Radio indicator */}
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border-2 flex items-center justify-center transition-colors"
                        style={isSelected
                          ? { borderColor: '#1B6B4A', backgroundColor: '#1B6B4A' }
                          : { borderColor: '#C8C8C4', backgroundColor: 'white' }
                        }
                      >
                        {isLoading
                          ? <RefreshCw size={8} className="animate-spin text-white" />
                          : isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        }
                      </div>
                      <span className="text-sm font-medium" style={{ color: isSelected ? '#1B6B4A' : '#1A1A18' }}>{lang.native}</span>
                      <span className="text-xs" style={{ color: isSelected ? '#1B6B4A' : '#6B6B66' }}>{lang.name}</span>
                      {isLoading && <RefreshCw size={11} className="animate-spin ml-auto" style={{ color: '#1B6B4A' }} />}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      </div>

      {selectedLang && (
        <div className="flex flex-col gap-4">

              {/* Re-translate button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B6B66]">
                  Auto-translated from English. Edit any field below to customise.
                </p>
                <button
                  onClick={() => autoTranslate(selectedLang)}
                  disabled={isTranslating(selectedLang)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1B6B4A] hover:text-[#134F36] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                  <RefreshCw size={12} className={isTranslating(selectedLang) ? 'animate-spin' : ''} />
                  Re-translate
                </button>
              </div>

              {isTranslating(selectedLang) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-lg text-sm text-[#1B6B4A]">
                  <RefreshCw size={14} className="animate-spin shrink-0" />
                  Translating all fields into {ALL_LANGUAGES.find((l) => l.code === selectedLang)?.name}...
                </div>
              )}

              {/* Form-level */}
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
                      placeholder="Translating..."
                      className={inputClass}
                    />
                  </div>
                  {form.description && (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#1A1A18]">Description</label>
                      <p className="text-xs text-[#6B6B66] mb-1">Original: {form.description}</p>
                      <input
                        type="text"
                        value={formTranslations[selectedLang]?.description ?? ''}
                        onChange={(e) => updateFormTranslation(selectedLang, 'description', e.target.value)}
                        placeholder="Translating..."
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1A1A18]">Thank you message</label>
                    <p className="text-xs text-[#6B6B66] mb-1">Original: {form.thankYouMsg}</p>
                    <input
                      type="text"
                      value={formTranslations[selectedLang]?.thankYouMsg ?? ''}
                      onChange={(e) => updateFormTranslation(selectedLang, 'thankYouMsg', e.target.value)}
                      placeholder="Translating..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Per-field */}
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
                        placeholder="Translating..."
                        className={inputClass}
                      />
                    </div>

                    {!NO_PLACEHOLDER_TYPES.has(field.fieldType) && field.placeholder && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#1A1A18]">Placeholder</label>
                        <p className="text-xs text-[#6B6B66] mb-1">Original: {field.placeholder}</p>
                        <input
                          type="text"
                          value={(fieldTranslations[field.id]?.[selectedLang]?.placeholder as string | undefined) ?? ''}
                          onChange={(e) => updateFieldTranslation(field.id, selectedLang, 'placeholder', e.target.value)}
                          placeholder="Translating..."
                          className={inputClass}
                        />
                      </div>
                    )}

                    {field.helpText && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#1A1A18]">Help text</label>
                        <p className="text-xs text-[#6B6B66] mb-1">Original: {field.helpText}</p>
                        <input
                          type="text"
                          value={(fieldTranslations[field.id]?.[selectedLang]?.helpText as string | undefined) ?? ''}
                          onChange={(e) => updateFieldTranslation(field.id, selectedLang, 'helpText', e.target.value)}
                          placeholder="Translating..."
                          className={inputClass}
                        />
                      </div>
                    )}

                    {HAS_OPTIONS_TYPES.has(field.fieldType) && (field.options ?? []).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#1A1A18]">Options</label>
                        {(field.options ?? []).map((opt, i) => {
                          const pipeIdx = opt.indexOf('|');
                          const optLabel = pipeIdx === -1 ? opt : opt.slice(0, pipeIdx);
                          return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-[#6B6B66] w-28 truncate shrink-0">{optLabel}</span>
                            <input
                              type="text"
                              value={getFieldOptionTranslation(field, selectedLang, i)}
                              onChange={(e) => updateFieldOptionTranslation(field.id, selectedLang, i, e.target.value)}
                              placeholder="Translating..."
                              className="flex-1 px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                            />
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} disabled={Object.values(translating).some(Boolean)}>
          Save translations
        </Button>
      </div>
    </div>
  );
}
