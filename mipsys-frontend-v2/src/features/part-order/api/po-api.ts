import { apiClient } from '@/src/lib/api-client';
import type { PurchaseOrder, CreatePurchaseOrderDto, PoStatus, ReceivePoItem } from '../types';

export const poApi = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get('/purchase-orders');
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderDto) => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data;
  },

  updateStatus: async (id: number, status: PoStatus) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/status`, { status, performedBy: 1 });
    return response.data;
  },

  receivePO: async (id: number, items: ReceivePoItem[]) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/receive`, { items, performedBy: 1 });
    return response.data;
  },
};
