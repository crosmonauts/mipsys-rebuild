import axios from 'axios';

// Konfigurasi Axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  getAll: (search = '', page = 1, limit = 10, status = 'ALL') =>
    api
      .get('/service-request/dashboard', { params: { search, page, limit, status } })
      .then((r) => r.data),

  getDetail: (ticketNumber: string) =>
    api.get(`/service-request/${ticketNumber}`).then((r) => r.data),

  updateEntry: (ticketNumber: string, data: any) =>
    api.patch(`/service-request/${ticketNumber}`, data).then((r) => r.data),

  getDashboardStats: () =>
    api.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    api.get('/service-request/activities').then((r) => r.data),

  create: async (rawData: any) => {
    const payload = {
      ...rawData,
      adminId: 1,
    };
    const response = await api.post('/service-request/entry', payload);
    return response.data;
  },

  searchSpareParts: (query: string) =>
    api
      .get(`/spare-parts/search`, { params: { q: query } })
      .then((r) => r.data),
};

export default api;
