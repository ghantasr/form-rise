import client from './client';
import type { Form, FormListItem } from '../types/form';

export const formsApi = {
  list: () =>
    client.get<FormListItem[]>('/forms'),

  get: (id: string) =>
    client.get<Form>(`/forms/${id}`),

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
};
