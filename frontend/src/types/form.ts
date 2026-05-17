export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'number'
  | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'rating' | 'url'
  | 'phone' | 'nps' | 'picture_choice';

// Per-field translations
export interface FieldTranslations {
  [langCode: string]: {
    label?: string;
    placeholder?: string;
    helpText?: string;
    options?: string[]; // same length as field.options
  };
}

// Per-form translations
export interface FormTranslations {
  [langCode: string]: {
    title?: string;
    description?: string;
    thankYouMsg?: string;
  };
}

export interface FormField {
  id: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  sortOrder: number;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    showIf?: { fieldId: string; equals: string };
  };
  translations?: FieldTranslations;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  isPublic: boolean;
  allowAnonymous: boolean;
  collectEmail: boolean;
  limitOneResponse: boolean;
  shuffleFields: boolean;
  showProgress: boolean;
  acceptFrom?: string;
  acceptUntil?: string;
  allowedEmails?: string[];
  thankYouMsg: string;
  forkedFromId?: string;
  forkCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  fields: FormField[];
  translations?: FormTranslations;
  enabledLanguages?: string[];
}

export interface FormListItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}
