import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoryModelDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama model wajib diisi' })
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
