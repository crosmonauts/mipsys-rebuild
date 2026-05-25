import { IsInt, Min } from 'class-validator';

export class AddPoItemDto {
  @IsInt()
  sparePartId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPrice!: number;
}
