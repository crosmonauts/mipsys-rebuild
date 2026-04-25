import { IsString, IsOptional } from 'class-validator';

export class HardwareCheckDto {
  @IsString()
  @IsOptional()
  phStatus!: string;

  @IsString()
  @IsOptional()
  mbStatus!: string;

  @IsString()
  @IsOptional()
  psStatus!: string;

  @IsString()
  @IsOptional()
  othersStatus!: string;
}
