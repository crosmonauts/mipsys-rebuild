import { apiClient } from '@/src/lib/api-client';

export interface PurchaseOrderItem {
  id?: number;
  partName: string;
  partCode?: string;
  qty: number;
  price: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  category: string;
  status: 'PENDING' | 'PROSES' | 'SELESAI' | 'BATAL';
  items: PurchaseOrderItem[];
  totalEstimation: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDto {
  supplier: string;
  category: string;
  status: string;
  items: { partName: string; qty: number; price: number }[];
  notes?: string;
}

export const poApi = {
  getAll: async () => {
    const response = await apiClient.get('/purchase-orders');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderDto) => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },

  cancel: async (id: number, notes?: string) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/cancel`, null, {
      params: { notes },
    });
    return response.data;
  },
};
