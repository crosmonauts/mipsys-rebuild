import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

export const MovementType = {
  PO_RECEIVE: 'PO_RECEIVE',
  SERVICE_USE: 'SERVICE_USE',
  ADJUSTMENT: 'ADJUSTMENT',
  SERVICE_RETURN: 'SERVICE_RETURN',
} as const;

export type MovementTypeType = (typeof MovementType)[keyof typeof MovementType];

export class CreateStockMovementDto {
  @IsInt()
  sparePartId!: number;

  @IsInt()
  quantity!: number;

  @IsEnum(MovementType)
  movementType!: MovementTypeType;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsInt()
  @IsOptional()
  performedBy?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
