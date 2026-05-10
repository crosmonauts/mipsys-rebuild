import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  ValidateNested,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';
import { PartItemDto } from './part-item.dto';

export enum StatusService {
  WAITING_CHECK = 'WAITING CHECK',
  PENDING_APPROVAL = 'PENDING APPROVAL',
  PENDING_PART = 'PENDING PART',
  SERVICE = 'SERVICE',
  DONE = 'DONE',
  CANCEL = 'CANCEL',
}

export class UpdateTechRequestDto {
  @IsInt({ message: 'ID Teknisi harus berupa angka (int)' })
  @IsNotEmpty()
  technicianCheckId!: number;

  @IsString()
  @IsNotEmpty()
  remarksHistory!: string;

  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @IsEnum(StatusService, { message: 'Status tidak valid' })
  @IsNotEmpty()
  statusService!: StatusService;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object) // Pastikan HardwareCheckDto diimport jika ingin lebih spesifik
  hardwareCheck?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto) // Ini kunci agar class-transformer bisa bekerja
  parts?: PartItemDto[];
}
