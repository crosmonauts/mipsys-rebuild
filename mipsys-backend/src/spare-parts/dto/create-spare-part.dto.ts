import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumberString,
  Min,
} from 'class-validator';

export class CreateSparePartDto {
  @IsString()
  @IsNotEmpty({ message: 'Part Code wajib diisi' })
  partCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama sparepart wajib diisi' })
  partName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Model mesin wajib diisi' })
  modelName!: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  refNo?: string;

  @IsInt({ message: 'Stok harus berupa angka bulat' })
  @Min(0)
  @IsOptional()
  stock: number = 0;

  // PERBAIKAN: Gunakan IsNumberString agar sinkron dengan tipe string
  @IsNumberString({}, { message: 'Harga harus berupa format angka' })
  @IsNotEmpty({ message: 'Harga wajib diisi' })
  price!: string;

  @IsString()
  @IsOptional()
  ipStatus: string = 'Non IP';

  @IsString()
  @IsOptional()
  note?: string;
}
