import client from './client';
import type { FormResponse } from '../types/response';

export interface SubmitAnswerDto {
  fieldId: string;
  value?: string;
  valuesArray?: string[];
  numericValue?: number;
}

export const responsesApi = {
  submit: (slug: string, respondentEmail: string | undefined, qrToken: string | undefined, answers: SubmitAnswerDto[]) =>
    client.post<FormResponse>(`/f/${slug}/submit`, { respondentEmail, qrToken, answers }),

  list: (formId: string, page = 1, pageSize = 50) =>
    client.get<FormResponse[]>(`/forms/${formId}/responses`, { params: { page, pageSize } }),

  get: (formId: string, responseId: string) =>
    client.get<FormResponse>(`/forms/${formId}/responses/${responseId}`),

  delete: (formId: string, responseId: string) =>
    client.delete(`/forms/${formId}/responses/${responseId}`),

  exportCsv: (formId: string) =>
    client.get(`/forms/${formId}/responses/export`, { responseType: 'blob' }),
};
