export interface Answer {
  fieldId: string;
  fieldLabel?: string;
  value?: string;
  valuesArray?: string[];
  numericValue?: number;
  isCorrect?: boolean;
  explanation?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentEmail?: string;
  isComplete: boolean;
  submittedAt: string;
  answers: Answer[];
  totalScore?: number;
  maxScore?: number;
  isPassed?: boolean;
}
