export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'number'
  | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'rating' | 'url';

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
