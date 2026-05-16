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
