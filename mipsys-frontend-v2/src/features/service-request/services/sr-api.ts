import { apiClient } from '@/src/lib/api-client';

export const srApi = {
  getAll: (search = '', page = 1, limit = 10, status = 'ALL') =>
    apiClient
      .get('/service-request/dashboard', { params: { search, page, limit, status } })
      .then((r) => r.data),

  getDetail: (ticketNumber: string) =>
    apiClient.get(`/service-request/${ticketNumber}`).then((r) => r.data),

  updateEntry: (ticketNumber: string, data: any) =>
    apiClient.patch(`/service-request/${ticketNumber}`, data).then((r) => r.data),

  getDashboardStats: () =>
    apiClient.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    apiClient.get('/service-request/activities').then((r) => r.data),

  create: async (rawData: any) => {
    const payload = {
      ...rawData,
      adminId: 1,
    };
    const response = await apiClient.post('/service-request/entry', payload);
    return response.data;
  },

  searchSpareParts: (query: string) =>
    apiClient
      .get(`/spare-parts/search`, { params: { q: query } })
      .then((r) => r.data),

  prosesKasir: async (ticketNumber: string, data: { serviceFee: number; partFee: number }) => {
    const invoice = await apiClient.post(`/finance/invoices/from-sr/${ticketNumber}`).then((r) => r.data);
    await apiClient.post(`/finance/invoices/${invoice.id}/pay`, {
      amount: data.serviceFee + data.partFee,
      paymentMethod: 'CASH',
      paidAt: new Date().toISOString(),
    });
    return invoice;
  },
};
