import { BadRequestException } from '@nestjs/common';

export type PoStatusType =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'ORDERED'
  | 'SHIPPED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export const VALID_PO_TRANSITIONS: Record<PoStatusType, PoStatusType[]> = {
  DRAFT: ['REQUESTED', 'CANCELLED'],
  REQUESTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ORDERED', 'CANCELLED'],
  ORDERED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['PARTIALLY_RECEIVED', 'RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

export function validatePoTransition(
  currentStatus: PoStatusType,
  newStatus: PoStatusType
) {
  const allowed = VALID_PO_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Transisi dari ${currentStatus} ke ${newStatus} dilarang.`
    );
  }
}
