import { useState } from 'react';
import { Star, Check } from 'lucide-react';
import type { FormField } from '../../types/form';

const COLOR_SWATCHES = [
  'bg-[#E8F5EE]', 'bg-[#FFF8E6]', 'bg-[#E8F0FF]', 'bg-[#FFE8E8]',
  'bg-[#F0E8FF]', 'bg-[#E8FFFC]', 'bg-[#FFF3E8]', 'bg-[#E8F8FF]',
];

function PictureOption({ opt, index, isSelected, primary, primaryLight, onChange, onAutoAdvance, altLabel }: {
  opt: string; index: number; isSelected: boolean;
  primary: string; primaryLight: string;
  onChange: (v: unknown) => void;
  onAutoAdvance?: () => void;
  altLabel?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const pipeIdx = opt.indexOf('|');
  const label  = pipeIdx === -1 ? opt : opt.slice(0, pipeIdx);
  const imgUrl = pipeIdx === -1 ? '' : opt.slice(pipeIdx + 1);

  const handleClick = () => {
    onChange(label);
    if (!isSelected) setTimeout(() => onAutoAdvance?.(), 420);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all duration-150 cursor-pointer focus:outline-none overflow-hidden touch-manipulation"
      style={isSelected ? { borderColor: primary, backgroundColor: primaryLight } : { borderColor: '#E8E8E4', backgroundColor: 'white' }}
    >
      <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {imgUrl && !imgFailed ? (
          <img
            src={imgUrl}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`w-full h-full ${COLOR_SWATCHES[index % COLOR_SWATCHES.length]} flex items-center justify-center`}>
            <span className="text-4xl">🖼</span>
          </div>
        )}
      </div>

      {isSelected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
          style={{ backgroundColor: primary }}
        >
          <Check size={13} color="white" strokeWidth={3} />
        </div>
      )}

      <span className="flex flex-col items-center">
        <span className="text-sm font-medium text-center leading-tight px-1" style={{ color: isSelected ? primary : '#1A1A18' }}>{label}</span>
        {altLabel && altLabel !== label && (
          <span className="text-[11px] text-center leading-tight px-1 mt-0.5" style={{ color: isSelected ? primary : '#6B6B66', opacity: 0.75 }}>{altLabel}</span>
        )}
      </span>
    </button>
  );
}

export interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  primary?: string;
  primaryLight?: string;
  onAutoAdvance?: () => void;
  autoFocus?: boolean;
  /** English (original) label shown below the translated label */
  altLabel?: string;
  /** English (original) help text shown below the translated help text */
  altHelpText?: string;
  /** English (original) option texts shown alongside translated options */
  altOptions?: string[];
}

const baseInputClass =
  'w-full px-3 py-3 border rounded-xl text-sm text-[#1A1A18] bg-white placeholder:text-[#6B6B66] outline-none transition-colors focus:ring-1';

const inputClass = (error?: string) =>
  `${baseInputClass} ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E8E8E4] focus:border-[#1B6B4A] focus:ring-[#E8F5EE]'
  }`;

export function FieldRenderer({
  field, value, onChange, error,
  primary = '#1B6B4A', primaryLight = '#E8F5EE',
  onAutoAdvance, autoFocus,
  altLabel, altHelpText, altOptions,
}: FieldRendererProps) {
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
            autoFocus={autoFocus}
            autoComplete="off"
          />
        );

      case 'long_text': {
        const maxLen = field.validation?.maxLength;
        const currentLen = strValue.length;
        return (
          <div>
            <textarea
              id={field.id}
              value={strValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`${inputClass(error)} resize-y`}
              autoFocus={autoFocus}
              maxLength={maxLen}
            />
            {maxLen != null && (
              <p
                className="text-xs mt-1 text-right tabular-nums"
                style={{ color: currentLen >= maxLen ? '#ef4444' : '#9B9B96' }}
              >
                {currentLen} / {maxLen}
              </p>
            )}
          </div>
        );
      }

      case 'email':
        return (
          <input
            id={field.id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'your@email.com'}
            className={inputClass(error)}
            autoFocus={autoFocus}
          />
        );

      case 'number':
        return (
          <input
            id={field.id}
            type="number"
            inputMode="numeric"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? '0'}
            min={field.validation?.min ?? 0}
            max={field.validation?.max}
            className={inputClass(error)}
            autoFocus={autoFocus}
          />
        );

      case 'url':
        return (
          <input
            id={field.id}
            type="url"
            inputMode="url"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'https://'}
            className={inputClass(error)}
            autoFocus={autoFocus}
          />
        );

      case 'date':
        return (
          <input
            id={field.id}
            type="date"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass(error)} cursor-pointer`}
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
            {(field.options ?? []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt, i) => {
              const isChecked = strValue === opt;
              const englishOpt = altOptions?.[i];
              return (
                <label
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl border cursor-pointer transition-all touch-manipulation"
                  style={isChecked
                    ? { borderColor: primary, backgroundColor: primaryLight }
                    : { borderColor: '#E8E8E4', backgroundColor: 'white' }
                  }
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={isChecked}
                    onChange={() => {
                      onChange(opt);
                      if (!isChecked) setTimeout(() => onAutoAdvance?.(), 420);
                    }}
                    className="w-4 h-4 cursor-pointer shrink-0"
                    style={{ accentColor: primary }}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium leading-snug" style={{ color: isChecked ? primary : '#1A1A18' }}>{opt}</span>
                    {englishOpt && englishOpt !== opt && (
                      <span className="text-xs leading-snug" style={{ color: isChecked ? primary : '#6B6B66', opacity: 0.75 }}>{englishOpt}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt, i) => {
              const isChecked = arrValue.includes(opt);
              const englishOpt = altOptions?.[i];
              return (
                <label
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl border cursor-pointer transition-all touch-manipulation"
                  style={isChecked
                    ? { borderColor: primary, backgroundColor: primaryLight }
                    : { borderColor: '#E8E8E4', backgroundColor: 'white' }
                  }
                >
                  <input
                    type="checkbox"
                    value={opt}
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...arrValue, opt]);
                      else onChange(arrValue.filter((v) => v !== opt));
                    }}
                    className="w-4 h-4 cursor-pointer rounded shrink-0"
                    style={{ accentColor: primary }}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium leading-snug" style={{ color: isChecked ? primary : '#1A1A18' }}>{opt}</span>
                    {englishOpt && englishOpt !== opt && (
                      <span className="text-xs leading-snug" style={{ color: isChecked ? primary : '#6B6B66', opacity: 0.75 }}>{englishOpt}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case 'rating':
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star`}
                onClick={() => onChange(star)}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none touch-manipulation p-1"
              >
                <Star
                  size={30}
                  style={star <= numValue ? { fill: primary, color: primary } : { fill: 'none', color: '#C8C8C4' }}
                />
              </button>
            ))}
            {numValue > 0 && (
              <span className="ml-1 text-sm font-medium" style={{ color: primary }}>{numValue} / 5</span>
            )}
          </div>
        );

      case 'phone':
        return (
          <input
            id={field.id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? '+91 98765 43210'}
            className={inputClass(error)}
            autoFocus={autoFocus}
          />
        );

      case 'nps': {
        const selected = value !== undefined && value !== null && value !== '';
        return (
          <div className="flex flex-col gap-3">
            {/* width:100% gives Safari a fixed boundary so overflow-x kicks in correctly */}
            <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'max-content' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className="rounded-lg text-sm font-semibold transition-all cursor-pointer focus:outline-none border touch-manipulation"
                    style={{
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                      ...(selected && numValue === n
                        ? { backgroundColor: primary, color: 'white', borderColor: primary }
                        : { backgroundColor: 'white', color: '#1A1A18', borderColor: '#E8E8E4' }),
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: '#6B6B66' }}>
              <span>Not likely at all</span>
              <span>Extremely likely</span>
            </div>
          </div>
        );
      }

      case 'picture_choice': {
        // Keep original index so altOptions (translations) still aligns correctly.
        // Only show options that have both a non-empty label AND a non-empty image URL —
        // incomplete options (creator left them blank) are silently hidden from respondents.
        const validOpts = (field.options ?? [])
          .map((opt, i) => {
            const pipe  = opt.indexOf('|');
            const label = (pipe === -1 ? opt : opt.slice(0, pipe)).trim();
            const url   = (pipe === -1 ? '' : opt.slice(pipe + 1)).trim();
            return { opt, i, label, url };
          })
          .filter(({ label, url }) => label.length > 0 && url.length > 0);

        if (validOpts.length === 0) return null;

        const cols = validOpts.length <= 2 ? 2 : validOpts.length === 3 ? 3 : validOpts.length === 4 ? 2 : 3;
        return (
          <div
            className="grid gap-3 w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {validOpts.map(({ opt, i }) => (
              <PictureOption
                key={i}
                opt={opt}
                index={i}
                isSelected={strValue === (opt.indexOf('|') === -1 ? opt : opt.slice(0, opt.indexOf('|')))}
                primary={primary}
                primaryLight={primaryLight}
                onChange={onChange}
                onAutoAdvance={onAutoAdvance}
                altLabel={altOptions?.[i]}
              />
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const isGroupType = ['radio', 'checkbox', 'rating', 'nps', 'picture_choice'].includes(field.fieldType);

  const labelContent = (
    <>
      <div className="flex flex-col gap-0.5">
        {isGroupType ? (
          <legend className="text-base font-semibold text-[#1A1A18] leading-snug float-none w-full p-0">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </legend>
        ) : (
          <label htmlFor={field.id} className="text-base font-semibold text-[#1A1A18] leading-snug">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {altLabel && altLabel !== field.label && (
          <p className="text-sm text-[#6B6B66] leading-snug">{altLabel}{field.isRequired && <span className="text-red-400 ml-1">*</span>}</p>
        )}
      </div>
      {(field.helpText || (altHelpText && altHelpText !== field.helpText)) && (
        <div className="flex flex-col gap-0.5 -mt-1">
          {field.helpText && <p className="text-sm text-[#6B6B66]">{field.helpText}</p>}
          {altHelpText && altHelpText !== field.helpText && <p className="text-xs text-[#9B9B96]">{altHelpText}</p>}
        </div>
      )}
    </>
  );

  const errorMsg = error && (
    <p className="text-sm text-red-500 flex items-center gap-1.5 mt-0.5">
      <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-[10px] font-bold flex items-center justify-center shrink-0">!</span>
      {error}
    </p>
  );

  if (isGroupType) {
    return (
      <fieldset className="flex flex-col gap-2.5 border-none p-0 m-0 min-w-0">
        {labelContent}
        {renderInput()}
        {errorMsg}
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {labelContent}
      {renderInput()}
      {errorMsg}
    </div>
  );
}
