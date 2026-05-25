import {
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DiagnosePartDto {
  @IsInt()
  sparePartId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class DiagnoseSrDto {
  @IsString()
  newStatus!: 'CHECK' | 'WAITING_APPROVE' | 'SERVICE' | 'DONE' | 'CANCEL';

  @IsString()
  @IsOptional()
  problemDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosePartDto)
  @IsOptional()
  parts?: DiagnosePartDto[];

  @IsInt()
  @IsOptional()
  performedBy?: number;
}
