import { apiClient } from '@/src/lib/api-client';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  ticketNumber: string;
  clientName: string;
  date: string;
  amount: number;
  serviceFee: number;
  partFee: number;
  ppn: number;
  total: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  method?: string;
  paidDate?: string;
  createdAt: string;
}

export interface FinanceStats {
  totalRevenue: number;
  pendingPayment: number;
  overdueAmount: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
}

export const financeApi = {
  getAll: async (search = '', status = '') => {
    const response = await apiClient.get('/finance/invoices', {
      params: { search, status },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/finance/invoices/${id}`);
    return response.data;
  },

  getStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get('/finance/stats');
    return response.data;
  },

  markAsPaid: async (id: number, method: string) => {
    const response = await apiClient.patch(`/finance/invoices/${id}/pay`, { method });
    return response.data;
  },

  exportReport: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/finance/export', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    return response.data;
  },
};
