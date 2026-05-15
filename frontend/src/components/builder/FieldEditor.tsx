import { Plus, X } from 'lucide-react';
import type { FormField } from '../../types/form';
import { Input } from '../shared/Input';

interface FieldEditorProps {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}

const NO_PLACEHOLDER_TYPES = new Set(['checkbox', 'radio', 'dropdown', 'date', 'rating']);
const HAS_OPTIONS_TYPES = new Set(['dropdown', 'radio', 'checkbox']);

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  const showPlaceholder = !NO_PLACEHOLDER_TYPES.has(field.fieldType);
  const showOptions = HAS_OPTIONS_TYPES.has(field.fieldType);

  const handleOptionChange = (index: number, value: string) => {
    const options = [...(field.options ?? [])];
    options[index] = value;
    onChange({ options });
  };

  const addOption = () => {
    const options = [...(field.options ?? [])];
    options.push(`Option ${options.length + 1}`);
    onChange({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options ?? [])];
    options.splice(index, 1);
    onChange({ options });
  };

  return (
    <div className="w-72 bg-white border-l border-[#E8E8E4] flex flex-col h-full overflow-y-auto">
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
              placeholder:text-[#9C9C96] transition-colors outline-none resize-none
              focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1A1A18]">Required</p>
            <p className="text-xs text-[#9C9C96]">Respondents must answer</p>
          </div>
          <button
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

        {showOptions && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[#1A1A18]">Options</p>
            <div className="flex flex-col gap-1.5">
              {(field.options ?? []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] bg-white
                      placeholder:text-[#9C9C96] outline-none focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="text-[#9C9C96] hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                    title="Remove option"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="flex items-center gap-1.5 text-sm text-[#1B6B4A] hover:text-[#134F36] transition-colors cursor-pointer mt-1"
            >
              <Plus size={14} />
              Add option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
