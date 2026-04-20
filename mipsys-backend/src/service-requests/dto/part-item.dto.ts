import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class PartItemDto {
  @IsOptional()
  @IsString()
  partNo?: string;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice!: number;
}
