import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { PurchaseOrderStatus } from 'src/db/schema';

export class UpdatePoStatusDto {
  @IsEnum(PurchaseOrderStatus, {
    message: `Status harus salah satu dari: ${Object.values(PurchaseOrderStatus).join(', ')}`,
  })
  @IsNotEmpty()
  status!: string;

  /**
   * Jumlah barang yang diterima. Hanya relevan saat status = RECEIVED.
   * Mendukung penerimaan parsial (misal: order 10, terima 7 dulu).
   * Jika tidak diisi, dianggap diterima sesuai quantity PO.
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  receivedQuantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
