import { Plus, X } from 'lucide-react';
import type { FormField } from '../../types/form';
import { Input } from '../shared/Input';

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  onChange: (updates: Partial<FormField>) => void;
}

const NO_PLACEHOLDER_TYPES = new Set(['checkbox', 'radio', 'dropdown', 'date', 'rating', 'nps']);
const HAS_OPTIONS_TYPES = new Set(['dropdown', 'radio', 'checkbox', 'picture_choice']);

export function FieldEditor({ field, allFields, onChange }: FieldEditorProps) {
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
                    {conditionalSourceOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
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
                    <div key={`${option}-${index}`} className="flex flex-col gap-1 p-2.5 border border-[#E8E8E4] rounded-lg bg-[#FAFAF8]">
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
                  <div key={`${option}-${index}`} className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
