import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class PartItemDto {
  @IsInt()
  @IsOptional()
  sparePartId?: number;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsInt()
  @Min(1, { message: 'Quantity minimal 1' })
  quantity!: number;

  @IsNumber({}, { message: 'Unit price harus berupa angka' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  unitPrice!: number;

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
