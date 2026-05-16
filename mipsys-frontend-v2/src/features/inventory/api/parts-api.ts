import { apiClient } from '@/src/lib/api-client';

export interface PartFilterParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const partsApi = {
  getAllParts: async (params: PartFilterParams) => {
    const response = await apiClient.get('/spare-parts', { params });
    return response.data;
  },

  addStock: async (id: number, quantity: number) => {
    const response = await apiClient.patch(
      `/spare-parts/${id}/add-stock`,
      { quantity }
    );
    return response.data;
  },

  reduceStock: async (id: number, quantity: number) => {
    const response = await apiClient.patch(
      `/spare-parts/${id}/reduce-stock`,
      { quantity }
    );
    return response.data;
  },
};
