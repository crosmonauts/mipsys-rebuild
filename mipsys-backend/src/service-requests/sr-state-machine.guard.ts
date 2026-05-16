import { BadRequestException } from '@nestjs/common';

export type SrStatusType =
  | 'WAITING_CHECK'
  | 'CHECK'
  | 'WAITING_APPROVE'
  | 'SERVICE'
  | 'DONE'
  | 'CANCEL';

export const VALID_SR_TRANSITIONS: Record<SrStatusType, SrStatusType[]> = {
  WAITING_CHECK: ['CHECK', 'CANCEL'],
  CHECK: ['WAITING_APPROVE', 'CANCEL'],
  WAITING_APPROVE: ['SERVICE', 'CANCEL'],
  SERVICE: ['DONE', 'CANCEL'],
  DONE: [],
  CANCEL: [],
};

export function validateSrTransition(
  currentStatus: SrStatusType,
  newStatus: SrStatusType
) {
  const allowed = VALID_SR_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Transisi status dari ${currentStatus} ke ${newStatus} tidak diizinkan.`
    );
  }
}
