import { apiClient } from '@/src/lib/api-client';

export interface OrderPart {
  id: number;
  sparePartId: number | null;
  partName: string;
  quantity: number;
  priceAtAction: string;
  status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'MANUAL_NEW';
  partCode: string | null;
  currentStock: number | null;
  createdAt: string;
}

export interface AddPartDto {
  serviceRequestId: number;
  sparePartId?: number;
  partName: string;
  quantity: number;
  priceAtAction?: number;
}

export const orderPartsApi = {
  getBySR: async (serviceRequestId: number) => {
    const response = await apiClient.get(`/order-parts/sr/${serviceRequestId}`);
    return response.data;
  },

  addPart: async (data: AddPartDto) => {
    const response = await apiClient.post('/order-parts', data);
    return response.data;
  },

  removePart: async (id: number) => {
    const response = await apiClient.delete(`/order-parts/${id}`);
    return response.data;
  },

  getTotal: async (serviceRequestId: number) => {
    const response = await apiClient.get(`/order-parts/sr/${serviceRequestId}/total`);
    return response.data;
  },
};
