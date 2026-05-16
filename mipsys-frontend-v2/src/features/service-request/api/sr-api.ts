import { apiClient } from '@/src/lib/api-client';

export const srApi = {
  getAll: (search = '', page = 1, limit = 10) =>
    apiClient
      .get('/service-request/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  getDetail: (ticketNumber: string) =>
    apiClient.get(`/service-request/${ticketNumber}`).then((r) => r.data),

  updateEntry: (ticketNumber: string, data: Record<string, unknown>) =>
    apiClient.patch(`/service-request/${ticketNumber}`, data).then((r) => r.data),

  getDashboardStats: () =>
    apiClient.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    apiClient.get('/service-request/activities').then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/service-request/entry', data).then((r) => r.data),

  prosesKasir: (ticketNumber: string, paymentData: Record<string, unknown>) =>
    apiClient
      .patch(`/service-request/${ticketNumber}/payment`, paymentData)
      .then((r) => r.data),

  searchSpareParts: (query: string) =>
    apiClient.get(`/inventory/parts/search`, { params: { q: query } }).then((r) => r.data),

  getLogs: (ticketNumber: string) =>
    apiClient.get(`/service-request/${ticketNumber}/logs`).then((r) => r.data),

  createLog: (ticketNumber: string, data: Record<string, unknown>) =>
    apiClient.post(`/service-request/${ticketNumber}/logs`, data).then((r) => r.data),

  diagnose: (ticketNumber: string, data: {
    newStatus: string;
    problemDescription?: string;
    parts?: { sparePartId: number; quantity: number }[];
    performedBy?: number;
  }) =>
    apiClient.post(`/service-request/${ticketNumber}/diagnose`, data).then((r) => r.data),
};
