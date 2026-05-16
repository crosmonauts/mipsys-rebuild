import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateServiceLogDto {
  @IsString()
  action!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  performedBy?: number;
}
