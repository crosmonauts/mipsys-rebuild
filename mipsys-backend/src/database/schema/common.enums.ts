export const StatusService = {
  WAITING_CHECK: 'WAITING_CHECK',
  CHECK: 'CHECK',
  WAITING_APPROVE: 'WAITING_APPROVE',
  SERVICE: 'SERVICE',
  DONE: 'DONE',
  CANCEL: 'CANCEL',
} as const;

export type StatusServiceType =
  (typeof StatusService)[keyof typeof StatusService];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  ORDERED: 'ORDERED',
  SHIPPED: 'SHIPPED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type PurchaseOrderStatusType =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];
