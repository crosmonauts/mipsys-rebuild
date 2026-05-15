import { apiClient } from '@/src/lib/api-client';

export interface PoItem {
  id: number;
  sparePartId: number;
  quantity: number;
  unitPrice: string;
  receivedQty: number;
  subtotal: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  status: string;
  requestedBy?: number;
  approvedBy?: number;
  orderDate?: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: string;
  notes?: string;
  items: PoItem[];
  createdAt: string;
}

export const poApi = {
  getAll: () =>
    apiClient.get('/purchase-orders').then((r) => r.data as PurchaseOrder[]),

  getOne: (id: number) =>
    apiClient.get(`/purchase-orders/${id}`).then((r) => r.data as PurchaseOrder),

  create: (data: { items: { sparePartId: number; quantity: number; unitPrice: number }[]; requestedBy: number; notes?: string }) =>
    apiClient.post('/purchase-orders', data).then((r) => r.data),

  updateStatus: (id: number, status: string, performedBy?: number) =>
    apiClient.patch(`/purchase-orders/${id}/status`, { status, performedBy }).then((r) => r.data),

  receivePO: (id: number, items: { poItemId: number; receivedQty: number }[], performedBy: number) =>
    apiClient.patch(`/purchase-orders/${id}/receive`, { items, performedBy }).then((r) => r.data),
};
