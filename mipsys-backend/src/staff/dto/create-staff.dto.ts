import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama staff wajib diisi' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Role wajib diisi' })
  @IsIn(['ADMIN', 'TECHNICIAN'], {
    message: 'Role harus ADMIN atau TECHNICIAN',
  })
  role!: 'ADMIN' | 'TECHNICIAN';
}
