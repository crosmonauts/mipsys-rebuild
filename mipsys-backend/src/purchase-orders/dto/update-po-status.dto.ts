import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { PurchaseOrderStatus } from 'src/db/schema';

export class UpdatePoStatusDto {
  @IsEnum(PurchaseOrderStatus, {
    message: `Status harus salah satu dari: ${Object.values(PurchaseOrderStatus).join(', ')}`,
  })
  @IsNotEmpty()
  status!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  receivedQuantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
