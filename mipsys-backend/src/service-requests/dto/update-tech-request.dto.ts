import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusService } from 'src/db/schema';
import { PartItemDto } from './part-item.dto';

export class UpdateTechRequestDto {
  @IsInt()
  @IsNotEmpty()
  technicianCheckId!: number;

  @IsString()
  @IsNotEmpty()
  remarksHistory!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceFee?: number;

  // FIX: Tipe sebelumnya 'any' — sekarang menggunakan StatusServiceType yang valid
  @IsEnum(StatusService, {
    message: `statusService harus salah satu dari: ${Object.values(StatusService).join(', ')}`,
  })
  @IsNotEmpty()
  statusService!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto)
  parts?: PartItemDto[];
}
