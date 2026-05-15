import type { FormField } from '../types/form';

export function validateField(field: FormField, value: unknown): string | null {
  const str = value as string;
  const num = Number(value);

  if (field.isRequired && (value === undefined || value === null || str === '' || (Array.isArray(value) && value.length === 0))) {
    return `${field.label} is required`;
  }

  if (!value && !field.isRequired) return null;

  if (field.fieldType === 'email' && str && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return 'Invalid email address';
  }
  if (field.fieldType === 'url' && str && !/^https?:\/\/.+/.test(str)) {
    return 'Invalid URL (must start with http:// or https://)';
  }

  const v = field.validation;
  if (!v) return null;

  if (v.minLength && str.length < v.minLength) return `Minimum ${v.minLength} characters`;
  if (v.maxLength && str.length > v.maxLength) return `Maximum ${v.maxLength} characters`;
  if (v.min !== undefined && num < v.min) return `Minimum value is ${v.min}`;
  if (v.max !== undefined && num > v.max) return `Maximum value is ${v.max}`;
  if (v.pattern && !new RegExp(v.pattern).test(str)) return 'Invalid format';

  return null;
}
