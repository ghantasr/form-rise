import client from './client';
import type { Form, FormListItem, FormTranslations, FieldTranslations } from '../types/form';

export interface UpdateTranslationsPayload {
  enabledLanguages: string[];
  formTranslations: FormTranslations;
  fieldTranslations: Record<string, FieldTranslations>;
}

export const formsApi = {
  list: () =>
    client.get<FormListItem[]>('/forms'),

  get: (id: string) =>
    client.get<Form>(`/forms/${id}`),

  getBySlug: (slug: string) =>
    client.get<Form>(`/forms/by-slug/${encodeURIComponent(slug)}`),

  getPublic: (slug: string) =>
    client.get<Form>(`/f/${slug}`),

  getPreview: (id: string) =>
    client.get<Form>(`/forms/${id}`),

  create: (title: string, description?: string) =>
    client.post<Form>('/forms', { title, description }),

  update: (id: string, data: Partial<Form> & { fields?: Form['fields'] }) =>
    client.put<Form>(`/forms/${id}`, data),

  delete: (id: string) =>
    client.delete(`/forms/${id}`),

  publish: (id: string) =>
    client.post<Form>(`/forms/${id}/publish`),

  unpublish: (id: string) =>
    client.post<Form>(`/forms/${id}/unpublish`),

  verifyAccess: (slug: string, email: string) =>
    client.get<{ allowed: boolean }>(`/f/${slug}/verify-access`, { params: { email } }),

  updateTranslations: (id: string, payload: UpdateTranslationsPayload) =>
    client.put<{ success: boolean }>(`/forms/${id}/translations`, payload),

  recordView: (slug: string) =>
    client.post<{ success: boolean }>(`/f/${slug}/analytics/view`),

  recordFieldReach: (slug: string, fieldIds: string[]) =>
    client.post<{ success: boolean }>(`/f/${slug}/analytics/field-reach`, { fieldIds }),

  getAnalytics: (id: string) =>
    client.get<{ viewCount: number; fieldDropoffs: Array<{ fieldId: string; reachCount: number }> }>(
      `/forms/${id}/analytics`
    ),
};
