import { Plus, X, Check, Star } from 'lucide-react';
import type { FormField, QuizConfig, QuizMatchType } from '../../types/form';
import { Input } from '../shared/Input';

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  isQuizMode: boolean;
  onChange: (updates: Partial<FormField>) => void;
}

const NO_PLACEHOLDER_TYPES = new Set(['checkbox', 'radio', 'dropdown', 'date', 'rating', 'nps']);
const HAS_OPTIONS_TYPES = new Set(['dropdown', 'radio', 'checkbox', 'picture_choice']);

// Quiz field categories
const OPTION_FIELD_TYPES   = new Set(['radio', 'dropdown', 'picture_choice']);
const MULTI_OPTION_TYPES   = new Set(['checkbox']);
const TEXT_FIELD_TYPES     = new Set(['short_text', 'long_text', 'email', 'url', 'phone']);
const NUMERIC_FIELD_TYPES  = new Set(['number', 'rating', 'nps']);
const DATE_FIELD_TYPES     = new Set(['date']);

const MATCH_TYPE_OPTIONS: { value: QuizMatchType; label: string; desc: string }[] = [
  { value: 'exact',      label: 'Exact',      desc: 'Case-insensitive, spaces matter — "Adi Lakshmi" ≠ "adilakshmi"' },
  { value: 'normalized', label: 'Normalized', desc: 'Ignores spaces & capitalisation — "Adi Lakshmi" = "adilakshmi"' },
  { value: 'contains',   label: 'Contains',   desc: 'Answer must include the keyword — "My name is Adi" matches "Adi"' },
  { value: 'startsWith', label: 'Starts with', desc: 'Answer must begin with the value — useful for prefixes' },
  { value: 'pattern',    label: 'Regex',       desc: 'Advanced — use a regular expression pattern' },
];

export function FieldEditor({ field, allFields, isQuizMode, onChange }: FieldEditorProps) {
  const showPlaceholder = !NO_PLACEHOLDER_TYPES.has(field.fieldType);
  const showOptions = HAS_OPTIONS_TYPES.has(field.fieldType);

  const showConditionally = !!field.conditional?.showIf;
  const conditionalFieldId = field.conditional?.showIf?.fieldId ?? '';
  const conditionalEquals = field.conditional?.showIf?.equals ?? '';

  const otherFields = allFields.filter((f) => f.id !== field.id);

  // The field being used as the condition source
  const conditionalSourceField = otherFields.find((f) => f.id === conditionalFieldId);
  // Options of the source field (label only, strips |url for picture_choice)
  const conditionalSourceOptions = conditionalSourceField
    ? (conditionalSourceField.options ?? []).map((o) => {
        const p = o.indexOf('|');
        return p === -1 ? o : o.slice(0, p);
      })
    : [];

  const handleConditionalToggle = () => {
    if (showConditionally) {
      onChange({ conditional: undefined });
    } else {
      onChange({ conditional: { showIf: { fieldId: '', equals: '' } } });
    }
  };

  const handleConditionalFieldChange = (fieldId: string) => {
    // Reset equals when source field changes — old value is semantically invalid for new field
    onChange({ conditional: { showIf: { fieldId, equals: '' } } });
  };

  const handleConditionalEqualsChange = (equals: string) => {
    onChange({ conditional: { showIf: { fieldId: conditionalFieldId, equals } } });
  };

  const isPictureChoice = field.fieldType === 'picture_choice';
  const showQuizConfig = isQuizMode;

  const quizInputCategory = OPTION_FIELD_TYPES.has(field.fieldType)  ? 'option'
    : MULTI_OPTION_TYPES.has(field.fieldType)                        ? 'multi'
    : TEXT_FIELD_TYPES.has(field.fieldType)                          ? 'text'
    : NUMERIC_FIELD_TYPES.has(field.fieldType)                       ? 'numeric'
    : DATE_FIELD_TYPES.has(field.fieldType)                          ? 'date'
    : 'text';

  const updateQuizConfig = (updates: Partial<QuizConfig>) => {
    const current = field.quizConfig ?? { correctAnswers: [], points: 1 };
    onChange({ quizConfig: { ...current, ...updates } });
  };

  const toggleCorrectAnswer = (option: string) => {
    const current = field.quizConfig?.correctAnswers ?? [];
    if (quizInputCategory === 'multi') {
      const next = current.includes(option) ? current.filter((a) => a !== option) : [...current, option];
      updateQuizConfig({ correctAnswers: next });
    } else {
      updateQuizConfig({ correctAnswers: current.includes(option) ? [] : [option] });
    }
  };

  const parsePictureOption = (opt: string) => {
    const i = opt.indexOf('|');
    return i === -1 ? { label: opt, url: '' } : { label: opt.slice(0, i), url: opt.slice(i + 1) };
  };

  const handleOptionChange = (index: number, value: string) => {
    const options = [...(field.options ?? [])];
    options[index] = value;
    onChange({ options });
  };

  const handlePictureOptionChange = (index: number, label: string, url: string) => {
    const options = [...(field.options ?? [])];
    options[index] = `${label}|${url}`;
    onChange({ options });
  };

  const addOption = () => {
    const options = [...(field.options ?? [])];
    options.push(isPictureChoice ? `Option ${options.length + 1}|` : `Option ${options.length + 1}`);
    onChange({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options ?? [])];
    options.splice(index, 1);
    onChange({ options });
  };

  const handlePictureCountChange = (count: number) => {
    const options = [...(field.options ?? [])];
    while (options.length < count) options.push(`Option ${options.length + 1}|`);
    while (options.length > count) options.pop();
    onChange({ options });
  };

  return (
    <div className="w-full lg:w-72 bg-white border-l border-[#E8E8E4] flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#E8E8E4]">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider">Field Properties</p>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-5">
        <Input
          label="Label"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Enter field label"
        />

        {showPlaceholder && (
          <Input
            label="Placeholder"
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#1A1A18]">Help text</label>
          <textarea
            value={field.helpText ?? ''}
            onChange={(e) => onChange({ helpText: e.target.value })}
            placeholder="Optional description shown below the field"
            rows={2}
            className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
              placeholder:text-[#6B6B66] transition-colors outline-none resize-none
              focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1A1A18]">Required</p>
            <p className="text-xs text-[#6B6B66]">Respondents must answer</p>
          </div>
          <button
            role="switch"
            aria-checked={field.isRequired}
            aria-label="Required"
            onClick={() => onChange({ isRequired: !field.isRequired })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              field.isRequired ? 'bg-[#1B6B4A]' : 'bg-[#E8E8E4]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                field.isRequired ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Conditional logic */}
        <div className="flex flex-col gap-3 border-t border-[#E8E8E4] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1A1A18]">Show conditionally</p>
              <p className="text-xs text-[#6B6B66]">Only show based on another field</p>
            </div>
            <button
              role="switch"
              aria-checked={showConditionally}
              aria-label="Show conditionally"
              onClick={handleConditionalToggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                showConditionally ? 'bg-[#1B6B4A]' : 'bg-[#E8E8E4]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  showConditionally ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {showConditionally && (
            <div className="flex flex-col gap-2 bg-[#FAFAF8] rounded-lg p-3 border border-[#E8E8E4]">
              <p className="text-xs font-medium text-[#6B6B66] uppercase tracking-wider">Show this field if...</p>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B6B66]">Field</label>
                <select
                  value={conditionalFieldId}
                  onChange={(e) => handleConditionalFieldChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                    outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE] cursor-pointer"
                >
                  <option value="">Select a field...</option>
                  {otherFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label || `Field (${f.fieldType})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B6B66]">Equals</label>
                {conditionalSourceOptions.length > 0 ? (
                  <select
                    value={conditionalEquals}
                    onChange={(e) => handleConditionalEqualsChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE] cursor-pointer"
                  >
                    <option value="">Select a value...</option>
                    {conditionalSourceOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={conditionalEquals}
                    onChange={(e) => handleConditionalEqualsChange(e.target.value)}
                    placeholder="Enter value..."
                    className="w-full px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {showOptions && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[#1A1A18]">Options</p>

            {isPictureChoice && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#6B6B66]">Number of images</label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => handlePictureCountChange(n)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        (field.options ?? []).length === n
                          ? 'bg-[#1B6B4A] text-white border-[#1B6B4A]'
                          : 'bg-white text-[#6B6B66] border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {(field.options ?? []).map((option, index) => {
                if (isPictureChoice) {
                  const { label, url } = parsePictureOption(option);
                  return (
                    <div key={index} className="flex flex-col gap-1 p-2.5 border border-[#E8E8E4] rounded-lg bg-[#FAFAF8]">
                      <p className="text-xs font-medium text-[#6B6B66]">Image {index + 1}</p>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handlePictureOptionChange(index, e.target.value, url)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                          placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                        placeholder={`Label ${index + 1}`}
                      />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handlePictureOptionChange(index, label, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E8E4] rounded-lg text-xs text-[#1A1A18] bg-white
                          placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                        placeholder="Image URL (https://...)"
                      />
                      {url && (
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-40 object-cover rounded-md border border-[#E8E8E4]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                  );
                }
                return (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                        placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="text-[#6B6B66] hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                      title="Remove option"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {!isPictureChoice && (
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-sm text-[#1B6B4A] hover:text-[#134F36] transition-colors cursor-pointer mt-1"
              >
                <Plus size={14} />
                Add option
              </button>
            )}
          </div>
        )}

        {showQuizConfig && (
          <div className="flex flex-col gap-3 border-t border-[#E8E8E4] pt-4">
            <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider">Quiz Settings</p>

            {/* Points */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1A1A18]">Points</label>
              <input
                type="number"
                min={0} max={100}
                value={field.quizConfig?.points ?? 1}
                onChange={(e) => updateQuizConfig({ points: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                  outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
              />
            </div>

            {/* Correct answer — option fields (radio / dropdown / picture_choice) */}
            {(quizInputCategory === 'option' || quizInputCategory === 'multi') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1A1A18]">
                  {quizInputCategory === 'multi' ? 'Correct answers' : 'Correct answer'}
                </label>
                {(field.options ?? []).length === 0 ? (
                  <p className="text-xs text-[#6B6B66]">Add options above first</p>
                ) : (
                  (field.options ?? []).map((opt, idx) => {
                    const label = isPictureChoice ? (opt.indexOf('|') === -1 ? opt : opt.slice(0, opt.indexOf('|'))) : opt;
                    const isSelected = (field.quizConfig?.correctAnswers ?? []).includes(label);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCorrectAnswer(label)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F5EE] border-[#1B6B4A] text-[#1B6B4A] font-medium'
                            : 'bg-white border-[#E8E8E4] text-[#1A1A18] hover:border-[#1B6B4A]/40'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#1B6B4A] bg-[#1B6B4A]' : 'border-[#D0D0CC]'
                        }`}>
                          {isSelected && <Check size={9} className="text-white" />}
                        </span>
                        {label}
                      </button>
                    );
                  })
                )}
                {(field.options ?? []).length > 0 && (field.quizConfig?.correctAnswers ?? []).length === 0 && (
                  <p className="text-xs text-amber-600">No correct answer selected — respondents will score 0</p>
                )}
              </div>
            )}

            {/* Correct answer — text fields */}
            {quizInputCategory === 'text' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1A1A18]">Correct answer</label>
                  <input
                    type="text"
                    value={field.quizConfig?.correctAnswers?.[0] ?? ''}
                    onChange={(e) => updateQuizConfig({ correctAnswers: e.target.value ? [e.target.value] : [] })}
                    placeholder="Enter the correct answer..."
                    className="w-full px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      placeholder:text-[#6B6B66] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                  />
                  <p className="text-xs text-[#6B6B66]">Always case-insensitive. Use "Normalized" below to also ignore spaces.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#6B6B66] uppercase tracking-wider">How to match</label>
                  <div className="flex flex-col gap-1">
                    {MATCH_TYPE_OPTIONS.map((opt) => {
                      const isSelected = (field.quizConfig?.matchType ?? 'exact') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateQuizConfig({ matchType: opt.value })}
                          className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#E8F5EE] border-[#1B6B4A]'
                              : 'bg-white border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                          }`}
                        >
                          <span className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-[#1B6B4A] bg-[#1B6B4A]' : 'border-[#C8C8C4]'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-[#1B6B4A]' : 'text-[#1A1A18]'}`}>{opt.label}</span>
                            <span className="text-xs text-[#6B6B66] leading-snug">{opt.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {(field.quizConfig?.matchType === 'pattern') && (
                    <p className="text-xs text-[#6B6B66] mt-0.5">e.g. <code className="bg-[#F0F0EC] px-1 rounded">^[A-Z]\d+$</code></p>
                  )}
                </div>
              </div>
            )}

            {/* Correct answer — numeric fields */}
            {quizInputCategory === 'numeric' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1A1A18]">Correct value</label>
                  {field.fieldType === 'rating' ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const selected = Number(field.quizConfig?.correctAnswers?.[0] ?? 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateQuizConfig({ correctAnswers: [String(star)] })}
                            className="p-0.5 transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                          >
                            <Star
                              size={24}
                              style={selected ? { fill: '#1B6B4A', color: '#1B6B4A' } : { fill: 'none', color: '#C8C8C4' }}
                            />
                          </button>
                        );
                      })}
                      {field.quizConfig?.correctAnswers?.[0] && (
                        <span className="ml-1 text-sm font-medium text-[#1B6B4A]">{field.quizConfig.correctAnswers[0]} / 5</span>
                      )}
                    </div>
                  ) : (
                  <input
                    type="number"
                    value={field.quizConfig?.correctAnswers?.[0] ?? ''}
                    onChange={(e) => updateQuizConfig({ correctAnswers: e.target.value !== '' ? [e.target.value] : [] })}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                  />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1A1A18]">
                    Tolerance <span className="text-[#6B6B66] font-normal">(±)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={field.quizConfig?.tolerance ?? 0}
                    onChange={(e) => updateQuizConfig({ tolerance: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="w-full px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                  />
                  <p className="text-xs text-[#6B6B66]">0 = exact match. E.g. tolerance 2 accepts 40–44 for answer 42.</p>
                </div>
              </div>
            )}

            {/* Correct answer — date field */}
            {quizInputCategory === 'date' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1A1A18]">Correct date</label>
                <input
                  type="date"
                  value={field.quizConfig?.correctAnswers?.[0] ?? ''}
                  onChange={(e) => updateQuizConfig({ correctAnswers: e.target.value ? [e.target.value] : [] })}
                  className="w-full px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                    outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                />
              </div>
            )}

            {/* Explanation */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1A1A18]">Explanation <span className="text-[#6B6B66] font-normal">(optional)</span></label>
              <textarea
                value={field.quizConfig?.explanation ?? ''}
                onChange={(e) => updateQuizConfig({ explanation: e.target.value })}
                placeholder="Shown to respondents after submitting..."
                rows={2}
                className="w-full px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                  placeholder:text-[#6B6B66] outline-none resize-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
