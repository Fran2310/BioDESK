// user/dto/create-admin.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  ci: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  labName: string;

  @IsNotEmpty()
  @IsString()
  labRif: string;

  @IsNotEmpty()
  @IsString()
  labDir: string;

  @IsString()
  labPhone: string;
}
