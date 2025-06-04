// src/auth/dto/lab-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LabResponseDto {
  @ApiProperty({ example: 1, description: 'ID único del laboratorio' })
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
    example: 'j123456789',
    description: 'RIF del laboratorio en formato jXXXXXXXXX',
    pattern: '^j\\d{9}$',
  })
  rif: string;
}
