import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsInt({ message: 'sparePartId harus berupa angka' })
  @IsOptional()
  sparePartId?: number;

  @IsString()
  @IsNotEmpty({ message: 'Nama part wajib diisi' })
  @MaxLength(255)
  partName!: string;

  @IsInt()
  @Min(1, { message: 'Quantity minimal 1' })
  quantity!: number;

  @IsNumber({}, { message: 'Harga satuan harus berupa angka' })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
