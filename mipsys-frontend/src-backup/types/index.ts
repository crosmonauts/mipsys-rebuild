// ============================================================
// GLOBAL ENUMS & TYPES (Berasal dari Drizzle Schema)
// Optimasi: Menjamin Halstead & McCabe rendah di UI
// ============================================================

export const StatusService = {
  WAITING_CHECK: "WAITING_CHECK",
  CHECK: "CHECK",
  WAITING_APPROVE: "WAITING_APPROVE",
  SERVICE: "SERVICE",
  DONE: "DONE",
  CANCEL: "CANCEL",
} as const;

export type StatusServiceType =
  (typeof StatusService)[keyof typeof StatusService];

export const PurchaseOrderStatus = {
  REQUESTED: "REQUESTED",
  ORDERED: "ORDERED",
  SHIPPED: "SHIPPED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;

export type PurchaseOrderStatusType =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export type RoleType = "ADMIN" | "TECHNICIAN";
export type ServiceTypeEnum = "WARRANTY" | "NON_WARRANTY";
export type OrderPartStatusType = "IN_STOCK" | "OUT_OF_STOCK" | "MANUAL_NEW";

// ============================================================
// INTERFACES (Representasi Tabel Database)
// ============================================================

export interface Staff {
  id: number;
  name: string;
  role: RoleType;
}

export interface Customer {
  id: number;
  name: string;
  address: string | null;
  customerType: string | null;
}

export interface CustomerPhone {
  id: number;
  customerId: number | null;
  phone: string;
}

export interface Product {
  id: number;
  modelName: string;
  serialNumber: string;
}

export interface ServiceRequest {
  id: number;
  ticketNumber: string;
  rmaNo: string | null;
  incNo: string | null;
  serviceType: ServiceTypeEnum;
  customerId: number | null;
  productId: number | null;
  adminId: number | null;
  technicianCheckId: number | null;
  customerName?: string;
  modelName?: string;
  serialNumber?: string;
  orderParts?: OrderPart[];
  incomingDate: string;
  checkDate: string | null;
  spDate: string | null;
  approveDate: string | null;
  readyDate: string | null;
  closeDate: string | null;
  pickUpDate: string | null;
  agingDays: number;

  problemDescription: string | null;
  statusService: StatusServiceType;
  statusSystem: string | null;
  remarksHistory: string | null;
  serviceFee: string | number;
  partFee: string | number;
  shippingFee: string | number;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface SparePart {
  id: number;
  partCode: string | null;
  modelName: string | null;
  block: string | null;
  ref_no: string | null;
  partName: string;
  standard: string | null;
  type: string | null;
  stock: number;
  price: string | number;
  note: string | null;
  ipStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderPart {
  id: number;
  serviceRequestId: number | null;
  sparePartId: number | null;
  partName: string;
  quantity: number;
  priceAtAction: string | number;
  status: OrderPartStatusType;
  createdAt: string | null;
}

export interface PurchaseOrder {
  id: number;
  sparePartId: number | null;
  partName: string;
  quantity: number;
  unitPrice: string | number;
  status: PurchaseOrderStatusType;
  receivedQuantity: number;
  notes: string | null;
  orderedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ============================================================
// O(1) LOOKUP CONFIGURATIONS (Anti-Defect Visual Mapping)
// Mencegah if/else bersarang (McCabe = 1) pada rendering UI
// ============================================================

export const StatusBadgeLookup: Record<
  StatusServiceType,
  { label: string; bgClass: string }
> = {
  WAITING_CHECK: {
    label: "Waiting Check",
    bgClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  CHECK: {
    label: "Checking",
    bgClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  WAITING_APPROVE: {
    label: "Waiting Approve",
    bgClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  SERVICE: {
    label: "Servicing",
    bgClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  DONE: {
    label: "Done",
    bgClass: "bg-green-100 text-green-800 border-green-200",
  },
  CANCEL: {
    label: "Canceled",
    bgClass: "bg-red-100 text-red-800 border-red-200",
  },
};

export const POStatusBadgeLookup: Record<
  PurchaseOrderStatusType,
  { label: string; bgClass: string }
> = {
  REQUESTED: {
    label: "Requested",
    bgClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
  ORDERED: {
    label: "Ordered",
    bgClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    bgClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  RECEIVED: {
    label: "Received",
    bgClass: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    bgClass: "bg-red-100 text-red-800 border-red-200",
  },
};
