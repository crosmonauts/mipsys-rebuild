import { IsNumber, IsOptional, Min } from 'class-validator';

export class InputBiayaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  labor_cost?: number; 

  @IsOptional()
  @IsNumber()
  @Min(0)
  onsite_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  other_cost?: number; 
}