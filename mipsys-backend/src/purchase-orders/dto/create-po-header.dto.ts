import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoItemDto {
  @IsOptional()
  @IsInt()
  sparePartId?: number;

  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPrice!: number;
}

export class CreatePoHeaderDto {
  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requestedBy?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items!: CreatePoItemDto[];
}
