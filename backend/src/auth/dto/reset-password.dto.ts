import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario que solicita el cambio de contraseña'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'ABC123',
    description: 'Token de recuperación recibido por correo electrónico'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NuevaContraseñaSegura123',
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}