// src/auth/dto/login-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LabResponseDto } from './lab-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsI...',
    description: 'JWT de acceso para autenticación',
    minLength: 100,
  })
  access_token: string;

  @ApiProperty({
    type: [LabResponseDto],
    description:
      'Lista de objetos con datos de los laboratorios asociados al usuario',
    example: [
      {
        id: 1,
        name: 'Laboratorio pruebas',
        status: 'active',
        rif: 'j123456789',
      },
      {
        id: 9,
        name: 'Laboratorio pruebas 2',
        status: 'active',
        rif: 'j456789019',
      },
    ],
  })
  labs: LabResponseDto[];
}
