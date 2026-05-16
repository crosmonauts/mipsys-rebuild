export type PoStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'ORDERED'
  | 'SHIPPED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  status: PoStatus;
  totalAmount: string;
  notes?: string;
  requestedBy?: number;
  approvedBy?: number;
  orderDate?: string;
  expectedDate?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  purchaseOrderId?: number;
  sparePartId?: number;
  partName?: string;
  quantity: number;
  unitPrice: string;
  receivedQty?: number;
}

export interface CreatePurchaseOrderDto {
  supplierName: string;
  items: { sparePartId: number; quantity: number; unitPrice: string }[];
  notes?: string;
}

export interface PoStats {
  total: number;
  pending: number;
  completed: number;
}

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  DRAFT: 'Draft',
  REQUESTED: 'Diminta',
  APPROVED: 'Disetujui',
  ORDERED: 'Dipesan',
  SHIPPED: 'Dikirim',
  PARTIALLY_RECEIVED: 'Diterima Sebagian',
  RECEIVED: 'Diterima',
  CANCELLED: 'Dibatalkan',
};

export const PO_STATUS_BADGE: Record<PoStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  REQUESTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  ORDERED: 'bg-amber-100 text-amber-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
