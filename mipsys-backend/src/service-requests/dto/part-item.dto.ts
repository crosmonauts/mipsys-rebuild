import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class PartItemDto {
  @IsInt()
  @IsOptional()
  sparePartId?: number;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber() // Pastikan ini number
  @IsNotEmpty()
  unitPrice!: number; // Ubah dari string ke number agar sinkron dengan @IsNumber

  @IsString()
  @IsOptional()
  partCode?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  refNo?: string;

  @IsString()
  @IsOptional()
  ipStatus?: string;
}
