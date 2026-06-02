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
  modelName?: string;
  quantity: number;
  unitPrice: string;
  receivedQty?: number;
}

export interface CreatePurchaseOrderDto {
  supplierName: string;
  requestedBy?: number;
  items: { sparePartId?: number; partName?: string; modelName?: string; quantity: number; unitPrice: number }[];
  notes?: string;
}

export interface ReceivePoItem {
  poItemId: number;
  receivedQty: number;
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
  DRAFT: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  REQUESTED: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  APPROVED: 'bg-indigo-500/10 text-indigo-400',
  ORDERED: 'bg-amber-500/10 text-amber-400',
  SHIPPED: 'bg-purple-500/10 text-purple-400',
  PARTIALLY_RECEIVED: 'bg-orange-500/10 text-orange-400',
  RECEIVED: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  CANCELLED: 'bg-[var(--destructive)]/10 text-[var(--destructive)]',
};
