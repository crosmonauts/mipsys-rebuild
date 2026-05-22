import { Injectable } from '@nestjs/common';
import { validateSrTransition, SrStatusType } from '../sr-state-machine.guard';

@Injectable()
export class ServiceRequestStateMachine {
  validate(currentStatus: SrStatusType, newStatus: SrStatusType) {
    return validateSrTransition(currentStatus, newStatus);
  }
}
