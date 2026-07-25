export interface BillSettings {
  currency: string;
  taxRate: number;
  taxLabel: string;
  billPrefix: string;
  nextBillNumber: number;
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessGstin: string;
  logoBase64: string;
  footerNote: string;
  paymentTerms: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
}

export interface BillTemplateFromApi {
  id: string;
  name: string;
  description?: string;
  category: string;
  itemCount: number;
  createdAt: string;
}

export interface BillTemplateDetail {
  id: string;
  name: string;
  description?: string;
  category: string;
  currency: string;
  taxRate: number;
  taxLabel: string;
  senderName: string;
  senderEmail?: string;
  senderAddress?: string;
  senderGstin?: string;
  senderLogoBase64?: string;
  notes?: string;
  paymentTerms?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  accentColor: string;
  items: BillTemplateItemDto[];
  createdAt: string;
}

export interface BillTemplateItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  sortOrder: number;
}

export interface CreateBillTemplateRequest {
  name: string;
  description?: string;
  category: string;
  currency: string;
  taxRate: number;
  taxLabel: string;
  senderName: string;
  senderEmail?: string;
  senderAddress?: string;
  senderGstin?: string;
  senderLogoBase64?: string;
  notes?: string;
  paymentTerms?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  headerOrder?: string;
  invoiceLabel?: string;
  accentColor?: string;
  items: BillTemplateItemDto[];
}

export interface BillListItem {
  id: string;
  billNumber: string;
  status: BillStatus;
  recipientName: string;
  recipientEmail?: string;
  issueDate: string;
  dueDate?: string;
  total: number;
  currency: string;
  createdAt: string;
}

export type BillStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  taxable: boolean;
}

export interface Bill {
  id: string;
  billNumber: string;
  status: BillStatus;
  issueDate: string;
  dueDate?: string;
  currency: string;
  taxRate: number;
  taxLabel: string;
  // Recipient
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;
  recipientGstin?: string;
  // Sender
  senderName: string;
  senderEmail?: string;
  senderAddress?: string;
  senderGstin?: string;
  senderLogoBase64?: string;
  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  items: BillItem[];
  headerOrder?: string;
  invoiceLabel?: string;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

export interface UpdateBillItemRequest {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

export interface CreateBillRequest {
  issueDate?: string;
  dueDate?: string;
  currency: string;
  taxRate: number;
  taxLabel: string;
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;
  recipientGstin?: string;
  senderName: string;
  senderEmail?: string;
  senderAddress?: string;
  senderGstin?: string;
  senderLogoBase64?: string;
  notes?: string;
  paymentTerms?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  billNumber?: string;
  headerOrder?: string;
  invoiceLabel?: string;
  accentColor?: string;
  items?: CreateBillItemRequest[];
}

export interface BusinessProfile {
  id: string;
  name: string;
  email?: string;
  address?: string;
  gstin?: string;
  logoBase64?: string;
  isDefault: boolean;
  createdAt: string;
}