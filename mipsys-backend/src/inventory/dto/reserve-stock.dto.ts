import { IsInt, IsString, Min } from 'class-validator';

export class ReserveStockDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  srTicketNumber!: string;

  @IsInt()
  performedBy!: number;
}
