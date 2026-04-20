import { IsNumber, Min } from 'class-validator';

export class InputBiayaDto {
  @IsNumber()
  @Min(0)
  serviceFee!: number; // Murni Biaya Jasa Perbaikan

  @IsNumber()
  @Min(0)
  onsiteFee!: number; // Biaya Kunjungan/Transport (Sesuai request pemisahan)

  @IsNumber()
  @Min(0)
  partFee!: number; // Total Biaya Sparepart (Konfirmasi akhir)
}
