// user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { Gender } from '@prisma/client-lab';

export class CreatePatientDto {
  @ApiProperty({
	example: 'v12345678',
	description: 'Cédula de identidad',
  })
  @IsNotEmpty()
  @IsString()
  ci: string;

  @ApiProperty({ example: 'john', description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'doe', description: 'Apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'ripper', description: 'Segundo apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  secondLastName: string;

  @ApiProperty({ example: Gender.ANY, enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
	example: 'johndoe@example.com',
	description: 'Correo electrónico válido',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
	example: 'Av. Principal #123',
	description: 'Dirección fiscal completa',
	})
  @IsNotEmpty()
  @IsString()
  dir: string;
  
  @ApiProperty({
	type: [String],
	minItems: 1,
	example: ['04121234567', '02121234567'],
	})
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  phoneNums: string[];

  @ApiProperty({ example: '2025-06-14T00:00:00Z', description: 'Fecha en formato ISO 8601' })
  @IsNotEmpty()
  @IsDateString() // Valida que la cadena sea una fecha válida (e.g., 'YYYY-MM-DD' o ISO 8601)
  birthDate: string;
}
