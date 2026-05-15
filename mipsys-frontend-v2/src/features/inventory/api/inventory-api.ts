import { apiClient } from '@/src/lib/api-client';

export interface InventoryPart {
  id: number;
  partCode: string;
  partName: string;
  stock: number;
  minStock: number;
  price: string;
  location?: string;
  modelName?: string;
}

export const inventoryApi = {
  getParts: (search?: string, status?: 'ok' | 'low' | 'empty') =>
    apiClient
      .get('/inventory/parts', { params: { search, status } })
      .then((r) => r.data as InventoryPart[]),

  searchParts: (query: string) =>
    apiClient
      .get('/inventory/parts/search', { params: { q: query } })
      .then((r) => r.data as InventoryPart[]),

  getPart: (id: number) =>
    apiClient.get(`/inventory/parts/${id}`).then((r) => r.data as InventoryPart),

  getLowStockAlert: () =>
    apiClient.get('/inventory/low-stock-alert').then((r) => r.data as InventoryPart[]),

  reserveStock: (partId: number, data: { quantity: number; srTicketNumber: string; performedBy: number }) =>
    apiClient.post(`/inventory/parts/${partId}/reserve`, data).then((r) => r.data),
};
