import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : (value as string);

/** Parameter periode bersama untuk seluruh laporan. */
export class ReportPeriodQueryDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString({ strict: false }, { message: 'startDate harus berformat YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString({ strict: false }, { message: 'endDate harus berformat YYYY-MM-DD' })
  endDate?: string;
}

export class StockCardQueryDto extends ReportPeriodQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === null ? undefined : Number(value),
  )
  @IsInt({ message: 'sparePartId harus bilangan bulat' })
  @Min(1)
  @Max(2147483647)
  sparePartId?: number;
}
