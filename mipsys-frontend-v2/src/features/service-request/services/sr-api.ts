import axios from 'axios';

// Konfigurasi Axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  // 1. Ambil Semua Data Dashboard
  // Pastikan tetap /service-request/dashboard (Tanpa S)
  getAll: (search = '', page = 1, limit = 10) =>
    api
      .get('/service-request/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  // 2. Ambil Detail Per Unit
  // FIX: Hapus 's' di service-requests agar cocok dengan @Controller('service-request')
  getOne: (id: string | number) =>
    api.get(`/service-request/${id}`).then((r) => r.data),

  // 3. Create: Menangani Entry Baru
  // FIX: Hapus 's' di service-requests agar cocok dengan @Post('entry')
  create: async (rawData: any) => {
    const payload = {
      ...rawData,
      adminId: 1, // Hardcoded sementara sesuai kebutuhan Mas Nanda
      onsite_cost: Number(rawData.onsite_cost || 0),
      other_cost: Number(rawData.other_cost || 0),
    };
    const response = await api.post('/service-request/entry', payload);
    return response.data;
  },

  // 4. Update Technician (Diagnosa)
  updateTechnician: async (id: string | number, rawData: any) => {
    const payload = {
      technicianFixId: Number(rawData.techId),
      problemDescription: rawData.remarks,
      statusService: rawData.status,
      parts: (rawData.parts || []).map((p: any) => ({
        partName: p.partName,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };

    const response = await api.patch(
      `/service-request/${id}/technician`,
      payload,
    );
    return response.data;
  },

  // 5. Proses Kasir (Finalize)
  prosesKasir: (id: string | number, rawData: any) => {
    const payload = {
      ...rawData,
      onsiteFee: Number(rawData.onsiteFee || 0),
      serviceFee: Number(rawData.serviceFee || 0),
    };
    return api
      .patch(`/service-request/${id}/kasir`, payload)
      .then((r) => r.data);
  },
};

export default api; // Export default api juga penting untuk penggunaan di file lain
