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

export type QuizMatchType = 'exact' | 'normalized' | 'contains' | 'startsWith' | 'pattern';

export interface QuizConfig {
  correctAnswers: string[];   // option labels / text values / numeric strings / date strings
  points: number;
  explanation?: string;
  matchType?: QuizMatchType;  // text fields only, default 'exact'
  tolerance?: number;         // number fields only, ±tolerance (default 0)
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
  quizConfig?: QuizConfig;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  accessMode: string;
  orgId?: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  isPublic: boolean;
  allowAnonymous: boolean;
  collectEmail: boolean;
  limitOneResponse: boolean;
  shuffleFields: boolean;
  showProgress: boolean;
  isQuizMode: boolean;
  passMark: number;
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
  themeId?: string;
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
