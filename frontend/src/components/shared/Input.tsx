import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1A1A18]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-[#1A1A18] bg-white
            placeholder:text-[#6B6B66] transition-colors outline-none
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-[#E8E8E4] focus:border-[#1B6B4A] focus:ring-1 focus:ring-[#E8F5EE]'}
            ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6B6B66]">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
