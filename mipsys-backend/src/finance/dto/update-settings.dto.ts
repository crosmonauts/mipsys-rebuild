import { IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePpnRateDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ppnRate!: number;
}

export class UpdateInvoicePrefixDto {
  @IsString()
  invoicePrefix!: string;
}
