// user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'V-12345678',
    description: 'Cédula de identidad',
  })
  @IsNotEmpty()
  @IsString()
  ci: string;

  @ApiProperty({ example: 'nombre', description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'apellido', description: 'Apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'maria@laboratorio.com',
    description: 'Correo electrónico válido',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mínimo 8 caracteres, 1 mayúscula y 1 número',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
