import axios from 'axios';

// Konfigurasi Axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  // 1. Ambil Semua Data Dashboard
  getAll: (search = '', page = 1, limit = 10) =>
    api
      .get('/service-request/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  // 2. Ambil Detail Per Unit
  getOne: (id: string | number) =>
    api.get(`/service-request/${id}`).then((r) => r.data),

  getDashboardStats: () =>
    api.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    api.get('/service-request/activities').then((r) => r.data),

  // 3. Create Entry Baru
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

  // 4. Update Technician (Diagnosa & Hardware Check)
  updateTechnician: async (ticketNumber: string | number, rawData: any) => {
    // Ambil ID Teknisi dari segala kemungkinan field name di frontend
    const techIdValue = Number(
      rawData.technicianCheckId || rawData.techId || 0,
    );

    const payload = {
      technicianCheckId: techIdValue,
      remarksHistory: rawData.remarks || rawData.remarksHistory || '',
      statusService: rawData.status || rawData.statusService || 'SERVICE',
      serviceFee: Number(rawData.serviceFee || 0),
      parts: (rawData.parts || []).map((p: any) => ({
        sparePartId: p.sparePartId || null,
        refNo: p.refNo || p.sparePartId?.toString() || 'N/A',
        partName: p.partName || 'Sparepart',
        quantity: Number(p.quantity || 1),
        unitPrice: Number(p.unitPrice || 0),
        partCode: p.partCode || 'N/A',
        modelName: p.modelName || 'N/A',
        block: p.block || 'N/A',
        ipStatus: p.ipStatus || 'Non IP',
      })),
    };

    console.log('Payload Diagnosis yang dikirim ke Backend:', payload);

    const response = await api.patch(
      `/service-request/${ticketNumber}/diagnosis`,
      payload,
    );
    return response.data;
  },

  // 5. Proses Kasir (Finalize)
  prosesKasir: (ticketNumber: string | number, rawData: any) => {
    const payload = {
      ...rawData,
      onsiteFee: Number(rawData.onsiteFee || 0),
      serviceFee: Number(rawData.serviceFee || 0),
    };
    return api
      .patch(`/service-request/${ticketNumber}/kasir`, payload)
      .then((r) => r.data);
  },
};

export default api;
