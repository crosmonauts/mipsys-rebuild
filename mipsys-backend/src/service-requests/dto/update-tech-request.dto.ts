import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { PartItemDto } from './part-item.dto';

export class UpdateTechRequestDto {
  @IsInt({ message: 'ID Teknisi harus berupa angka (int)' })
  @IsNotEmpty()
  technicianFixId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Hasil diagnosa teknisi tidak boleh kosong' })
  remarksHistory!: string;

  @IsEnum(['WAITING CHECK', 'PENDING PART', 'SERVICE', 'DONE', 'CANCEL'], {
    message:
      'Status harus salah satu dari: WAITING CHECK, PENDING PART, SERVICE, DONE, atau CANCEL',
  })
  @IsNotEmpty()
  statusService!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto)
  parts?: PartItemDto[];
}
