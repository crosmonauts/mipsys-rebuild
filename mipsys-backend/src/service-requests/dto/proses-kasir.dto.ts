import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class ProsesKasirDto {
  @IsNumber()
  @Min(0)
  serviceFee!: number;

  @IsNumber()
  @Min(0)
  partFee!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFee?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
