import axios from 'axios';
import { SparePart, PartFilterParams } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const partsApi = {
  // 1. Ambil semua master sparepart dengan filter search & pagination
  getAllParts: async (params: PartFilterParams): Promise<any> => {
    const response = await api.get('/spare-parts', { params });
    // Mengembalikan seluruh objek response agar metadata pagination (.meta) terbaca
    return response.data;
  },

  // 2. Tambah/Restock stok suku cadang master
  addStock: async (id: number, quantity: number) => {
    const response = await api.patch(`/spare-parts/${id}/add-stock`, {
      quantity,
    });
    return response.data;
  },
};
