// /src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'useremail@xample.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
