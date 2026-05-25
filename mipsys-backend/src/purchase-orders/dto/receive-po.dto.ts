import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceivePoItemDto {
  @IsInt()
  poItemId!: number;

  @IsInt()
  @Min(1)
  receivedQty!: number;
}

export class ReceivePoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePoItemDto)
  items!: ReceivePoItemDto[];

  @IsInt()
  performedBy!: number;
}
