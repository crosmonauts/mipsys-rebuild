import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[0-9+\-() ]*$/, {
    message: 'Format nomor telepon tidak valid',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @IsIn(['PERSONAL', 'CORPORATE'], {
    message: 'Tipe pelanggan harus PERSONAL atau CORPORATE',
  })
  customerType?: string;
}
