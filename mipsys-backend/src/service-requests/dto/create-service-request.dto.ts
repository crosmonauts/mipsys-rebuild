import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export enum ServiceType {
  WARRANTY = 'WARRANTY',
  NON_WARRANTY = 'NON_WARRANTY',
}

export class CreateServiceRequestDto {
  // --- Target: Tabel Customers ---
  @IsString()
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @MaxLength(255)
  customerName!: string; // Gunakan ! karena @IsNotEmpty

  @IsString()
  @IsOptional()
  address?: string;

  @IsInt({ message: 'Admin ID harus berupa angka' })
  @IsNotEmpty({ message: 'Admin ID wajib disertakan' })
  adminId!: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customerType?: string;

  // --- Target: Tabel Customer Phones ---
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @MaxLength(50)
  phone!: string;

  // --- Target: Tabel Products ---
  @IsString()
  @IsNotEmpty({ message: 'Model barang wajib diisi' })
  @MaxLength(100)
  modelName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Serial Number wajib diisi' })
  @MaxLength(100)
  serialNumber!: string;

  // --- Target: Tabel Service Requests ---
  @IsNotEmpty()
  @IsIn(Object.values(ServiceType), {
    message: 'Tipe servis harus WARRANTY atau NON_WARRANTY',
  })
  serviceType!: ServiceType;

  @IsString()
  @IsOptional()
  problemDescription?: string;

  @IsNumber({}, { message: 'Biaya servis harus berupa angka' })
  @Min(0, { message: 'Biaya servis tidak boleh negatif' })
  @IsOptional() // Tambahkan ini jika biaya servis boleh kosong di awal
  serviceFee?: number;
}
