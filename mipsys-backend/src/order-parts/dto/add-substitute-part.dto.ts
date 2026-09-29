import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class AddSubstitutePartDto {
  @IsInt()
  serviceRequestId!: number;

  @IsInt()
  sparePartId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsNotEmpty({ message: 'Alasan substitusi wajib diisi.' })
  @MaxLength(500, { message: 'Alasan substitusi maksimal 500 karakter.' })
  substituteReason!: string;
}
