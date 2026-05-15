export interface Answer {
  fieldId: string;
  fieldLabel?: string;
  value?: string;
  valuesArray?: string[];
  numericValue?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentEmail?: string;
  isComplete: boolean;
  submittedAt: string;
  answers: Answer[];
}
