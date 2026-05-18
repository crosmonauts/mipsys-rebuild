import { IsInt, Min } from 'class-validator';

export class CreateOrderPartDto {
  @IsInt()
  serviceRequestId!: number;

  @IsInt()
  sparePartId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
