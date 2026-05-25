import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama model wajib diisi' })
  @MaxLength(100)
  modelName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Serial number wajib diisi' })
  @MaxLength(100)
  serialNumber!: string;
}
