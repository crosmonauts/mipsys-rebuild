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

  create: async (rawData: any) => {
    const payload = {
      ...rawData,
      adminId: 1,
    };
    const response = await api.post('/service-request/entry', payload);
    return response.data;
  },

  // 4. Update Technician (Diagnosa)
  updateTechnician: async (ticketNumber: string | number, rawData: any) => {
    // Mapping ulang payload agar sesuai dengan UpdateTechRequestDto di Backend
    const payload = {
      technicianFixId: Number(rawData.techId || rawData.technicianFixId),

      // PERBAIKAN DI SINI: Ubah dari problemDescription ke remarksHistory
      remarksHistory: rawData.remarks || rawData.remarksHistory,

      statusService: rawData.status || rawData.statusService,
      parts: (rawData.parts || []).map((p: any) => ({
        partName: p.partName,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };

    const response = await api.patch(
      `/service-request/${ticketNumber}/technician`,
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

export default api; // Export default api juga penting untuk penggunaan di file lain
