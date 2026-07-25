import client from './client';
import type {
  Bill,
  BillListItem,
  BillTemplateFromApi,
  BillTemplateDetail,
  CreateBillRequest,
  CreateBillTemplateRequest,
} from '../types/bill';

export const billsApi = {
  list: (params?: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    client.get<BillListItem[]>('/bills', { params }),

  get: (id: string) =>
    client.get<Bill>(`/bills/${id}`),

  getByNumber: (billNumber: string) =>
    client.get<Bill>(`/bills/by-number/${encodeURIComponent(billNumber)}`),

  create: (data: CreateBillRequest) =>
    client.post<Bill>('/bills', data),

  update: (id: string, data: Partial<CreateBillRequest>) =>
    client.put<Bill>(`/bills/${id}`, data),

  delete: (id: string) =>
    client.delete(`/bills/${id}`),

  updateStatus: (id: string, status: string) =>
    client.patch<Bill>(`/bills/${id}/status`, { status }),

  downloadPdf: (id: string) =>
    client.get(`/bills/${id}/pdf`, { responseType: 'blob' }),

  send: (id: string) =>
    client.post<{ success: boolean }>(`/bills/${id}/send`),

  getNextNumber: (prefix?: string) =>
    client.get<{ billNumber: string }>('/bills/next-number', { params: { prefix } }),

  // Bill templates (user-saved)
  listTemplates: (category?: string) =>
    client.get<BillTemplateFromApi[]>('/bill-templates', { params: category ? { category } : undefined }),

  getTemplate: (id: string) =>
    client.get<BillTemplateDetail>(`/bill-templates/${id}`),

  createTemplate: (data: CreateBillTemplateRequest) =>
    client.post<BillTemplateDetail>('/bill-templates', data),

  deleteTemplate: (id: string) =>
    client.delete(`/bill-templates/${id}`),
};
