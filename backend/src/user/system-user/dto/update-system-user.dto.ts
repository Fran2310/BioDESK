// src/user/dto/update-system-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateSystemUserDto {
  @ApiPropertyOptional({ description: 'Nuevo nombre del usuario' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nuevo apellido del usuario' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Nuevo email del usuario' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
