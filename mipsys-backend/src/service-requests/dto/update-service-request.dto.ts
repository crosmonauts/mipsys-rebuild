import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceRequestDto } from './create-service-request.dto';

export class UpdateServiceRequestDto extends PartialType(
  OmitType(CreateServiceRequestDto, ['adminId'] as const)
) {}
