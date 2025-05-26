// src/auth/dto/lab-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LabResponseDto {
  @ApiProperty({ example: 8, description: 'ID único del laboratorio' })
  id: number;

  @ApiProperty({
    example: 'Laboratorio de pruebas',
    description: 'Nombre del laboratorio',
  })
  name: string;

  @ApiProperty({
    example: 'active',
    description: 'Estado del laboratorio',
    enum: ['active', 'inactive'],
  })
  status: string;

  @ApiProperty({
    example: 'J-12345678-9',
    description: 'RIF del laboratorio en formato J-XXXXXXXX-X',
    pattern: '^J-\\d{8}-\\d$',
  })
  rif: string;
}
