import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Form kosong mengirim '' (bukan undefined), dan @IsOptional hanya
 * melewati null/undefined. String kosong dinormalkan menjadi undefined
 * agar "kosongkan field" tidak ditolak validasi.
 */
const blankToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class UpdateCompanyProfileDto {
  @IsString()
  @MinLength(1, { message: 'Nama perusahaan wajib diisi.' })
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Alamat wajib diisi.' })
  @MaxLength(500)
  address!: string;

  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(200)
  city?: string;

  @IsString()
  @MinLength(1, { message: 'Telepon wajib diisi.' })
  @MaxLength(50)
  phone!: string;

  @IsOptional()
  @Transform(blankToUndefined)
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @Transform(blankToUndefined)
  @Matches(/^[0-9.\-\s]{15,20}$/, {
    message:
      'NPWP harus 15 digit (perorangan) atau 16 digit (badan usaha), hanya angka.',
  })
  @MaxLength(20)
  npwp?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPkp?: boolean;
}
