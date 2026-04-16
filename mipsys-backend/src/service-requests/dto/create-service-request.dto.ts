import { IsNotEmpty, IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';

export class CreateServiceRequestDto {
  // WAJIB: Gunakan tanda ! agar TypeScript tidak protes
  @IsString() @IsNotEmpty() customer_name!: string;
  @IsString() @IsNotEmpty() phone_number!: string;
  @IsString() @IsNotEmpty() address_1!: string;
  @IsString() @IsNotEmpty() address_3!: string;
  @IsString() @IsNotEmpty() machine_model!: string;
  @IsString() @IsNotEmpty() problem_desc!: string;
  @IsString() @IsNotEmpty() warranty_status!: string;
  @IsString() @IsNotEmpty() service_mode!: string;

  // OPSIONAL: Gunakan tanda ? karena memang boleh kosong
  @IsOptional() @IsString() customer_type?: string;
  @IsOptional() @IsString() service_action?: string;
  @IsOptional() @IsString() contact_person?: string;
  @IsOptional() @IsString() address_2?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() serial_number?: string;
  @IsOptional() @IsString() ink_type?: string;
  @IsOptional() @IsString() accessories?: string;
  @IsOptional() @IsNumber() onsite_cost?: number;
  @IsOptional() @IsNumber() other_cost?: number;
}