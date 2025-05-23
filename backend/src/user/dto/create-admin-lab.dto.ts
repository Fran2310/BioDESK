// user/dto/create-admin-lab.dto.ts
import { IsArray, ArrayMinSize, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminLabDto {
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

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  labPhone: string[];
}
