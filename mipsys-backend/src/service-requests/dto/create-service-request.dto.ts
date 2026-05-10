import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';

export enum ServiceType {
  WARRANTY = 'WARRANTY',
  NON_WARRANTY = 'NON_WARRANTY',
}

export class CreateServiceRequestDto {
  // --- Customer ---
  @IsString()
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @MaxLength(255)
  customerName!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customerType?: string;

  // FIX: Phone divalidasi format dan sekarang benar-benar disimpan ke DB
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @MaxLength(50)
  @Matches(/^[0-9+\-() ]+$/, { message: 'Format nomor telepon tidak valid' })
  phone!: string;

  // --- Product ---
  @IsString()
  @IsNotEmpty({ message: 'Model barang wajib diisi' })
  @MaxLength(100)
  modelName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Serial Number wajib diisi' })
  @MaxLength(100)
  serialNumber!: string;

  // --- Service Request ---
  @IsNotEmpty()
  @IsIn(Object.values(ServiceType), {
    message: 'Tipe servis harus WARRANTY atau NON_WARRANTY',
  })
  serviceType!: ServiceType;

  @IsString()
  @IsOptional()
  problemDescription?: string;

  // NOTE: adminId seharusnya diambil dari JWT / Auth Guard.
  // Sementara ini tetap di body, tapi idealnya dihapus dari DTO.
  @IsInt({ message: 'Admin ID harus berupa angka' })
  @IsNotEmpty({ message: 'Admin ID wajib disertakan' })
  adminId!: number;

  @IsNumber({}, { message: 'Biaya servis harus berupa angka' })
  @Min(0, { message: 'Biaya servis tidak boleh negatif' })
  @IsOptional()
  serviceFee?: number;
}
