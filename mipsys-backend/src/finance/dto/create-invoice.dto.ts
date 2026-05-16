import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
}

export class CreateInvoiceDto {
  @IsString()
  ticketNumber!: string;

  @IsString()
  clientName!: string;

  @IsNumber()
  @Type(() => Number)
  serviceFee!: number;

  @IsNumber()
  @Type(() => Number)
  partFee!: number;

  @IsNumber()
  @Type(() => Number)
  shippingFee!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkInvoicePaidDto {
  @IsString()
  method!: string;
}

export class QueryInvoiceDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
