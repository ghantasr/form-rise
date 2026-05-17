import { Star } from 'lucide-react';
import type { FormField } from '../../types/form';

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

const baseInputClass =
  'w-full px-3 py-2 border rounded-lg text-sm text-[#1A1A18] bg-white placeholder:text-[#6B6B66] outline-none transition-colors focus:ring-1';

const inputClass = (error?: string) =>
  `${baseInputClass} ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E8E8E4] focus:border-[#1B6B4A] focus:ring-[#E8F5EE]'
  }`;

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const strValue = (value as string) ?? '';
  const numValue = (value as number) ?? 0;
  const arrValue = (value as string[]) ?? [];

  const renderInput = () => {
    switch (field.fieldType) {
      case 'short_text':
        return (
          <input
            id={field.id}
            type="text"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClass(error)}
          />
        );

      case 'long_text':
        return (
          <textarea
            id={field.id}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${inputClass(error)} resize-y`}
          />
        );

      case 'email':
        return (
          <input
            id={field.id}
            type="email"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'your@email.com'}
            className={inputClass(error)}
          />
        );

      case 'number':
        return (
          <input
            id={field.id}
            type="number"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? '0'}
            min={field.validation?.min}
            max={field.validation?.max}
            className={inputClass(error)}
          />
        );

      case 'url':
        return (
          <input
            id={field.id}
            type="url"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'https://'}
            className={inputClass(error)}
          />
        );

      case 'date':
        return (
          <input
            id={field.id}
            type="date"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass(error)}
          />
        );

      case 'dropdown':
        return (
          <select
            id={field.id}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass(error)} cursor-pointer`}
          >
            <option value="">Select an option</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={strValue === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 accent-[#1B6B4A] cursor-pointer"
                />
                <span className="text-sm text-[#1A1A18] group-hover:text-[#1B6B4A] transition-colors">
                  {opt}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={opt}
                  checked={arrValue.includes(opt)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...arrValue, opt]);
                    } else {
                      onChange(arrValue.filter((v) => v !== opt));
                    }
                  }}
                  className="w-4 h-4 accent-[#1B6B4A] cursor-pointer rounded"
                />
                <span className="text-sm text-[#1A1A18] group-hover:text-[#1B6B4A] transition-colors">
                  {opt}
                </span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="cursor-pointer transition-colors focus:outline-none"
              >
                <Star
                  size={28}
                  className={
                    star <= numValue
                      ? 'fill-[#1B6B4A] text-[#1B6B4A]'
                      : 'fill-none text-[#C8C8C4] hover:text-[#1B6B4A]'
                  }
                />
              </button>
            ))}
            {numValue > 0 && (
              <span className="ml-2 text-xs text-[#6B6B66]">{numValue} / 5</span>
            )}
          </div>
        );

      case 'phone':
        return (
          <input
            id={field.id}
            type="tel"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? '+1 (555) 000-0000'}
            className={inputClass(error)}
          />
        );

      case 'nps':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none border ${
                    numValue === n && value !== undefined && value !== null && value !== ''
                      ? 'bg-[#1B6B4A] text-white border-[#1B6B4A]'
                      : 'bg-white text-[#1A1A18] border-[#E8E8E4] hover:border-[#1B6B4A] hover:text-[#1B6B4A]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B6B66]">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>
        );

      case 'picture_choice': {
        const opts = field.options ?? [];
        const colorSwatches = [
          'bg-[#E8F5EE]', 'bg-[#FFF8E6]', 'bg-[#E8F0FF]', 'bg-[#FFE8E8]',
          'bg-[#F0E8FF]', 'bg-[#E8FFFC]', 'bg-[#FFF3E8]', 'bg-[#E8F8FF]',
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {opts.map((opt, i) => {
              const isSelected = strValue === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'border-[#1B6B4A] bg-[#E8F5EE]'
                      : 'border-[#E8E8E4] bg-white hover:border-[#1B6B4A]/40'
                  }`}
                >
                  <div
                    className={`w-full h-20 rounded-lg ${colorSwatches[i % colorSwatches.length]} flex items-center justify-center`}
                  >
                    <span className="text-2xl text-[#6B6B66]">🖼</span>
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#1B6B4A]' : 'text-[#1A1A18]'}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium text-[#1A1A18]">
        {field.label}
        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && <p className="text-xs text-[#6B6B66]">{field.helpText}</p>}
      {renderInput()}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
