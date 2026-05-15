import client from './client';

export interface QrDto {
  id: string;
  token: string;
  label?: string;
  status: string;
  expiresAt?: string;
  url: string;
  qrImageBase64: string;
}

export const qrApi = {
  generate: (formId: string, count = 1, labelPrefix?: string, expiresAt?: string) =>
    client.post<QrDto[]>(`/forms/${formId}/qr`, { count, labelPrefix, expiresAt }),

  list: (formId: string) =>
    client.get<QrDto[]>(`/forms/${formId}/qr`),

  delete: (formId: string, qrId: string) =>
    client.delete(`/forms/${formId}/qr/${qrId}`),
};
