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
  @IsInt()
  sparePartId!: number;

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

  @IsInt()
  @Min(1)
  requestedBy!: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items!: CreatePoItemDto[];
}
