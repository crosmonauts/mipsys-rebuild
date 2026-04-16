import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// 1. Buat Sub-Schema untuk Sparepart
export class PartItemDto {
  @IsString() @IsNotEmpty() part_no!: string;
  @IsString() @IsNotEmpty() part_name!: string;
  @IsNumber() @IsNotEmpty() quantity!: number;
  @IsNumber() @IsNotEmpty() unit_price!: number;
}

// 2. Schema Utama Teknisi
export class UpdateTechRequestDto {
  @IsString() @IsNotEmpty() technician_name!: string;
  @IsString() @IsNotEmpty() tech_remarks!: string;

  // 3. Array of Spareparts (Opsional, karena tidak semua servis butuh part)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validasi setiap isi array
  @Type(() => PartItemDto) // Beritahu NestJS bentuk array-nya
  parts?: PartItemDto[];
}