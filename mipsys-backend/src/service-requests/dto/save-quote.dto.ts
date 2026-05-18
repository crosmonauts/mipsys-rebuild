import {
  IsNumber,
  Min,
  IsOptional,
  IsInt,
} from 'class-validator';

export class SaveQuoteDto {
  @IsNumber()
  @Min(0)
  serviceFee!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFee?: number;

  @IsInt()
  @IsOptional()
  performedBy?: number;
}
