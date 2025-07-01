// user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

import { State, Priority } from '@prisma/client-lab';
import { InputJsonValue } from '@prisma/client/runtime/library';


export class CreateRequestMedicTestDto {
  @ApiProperty({ example: Priority.MEDIUM, enum: Priority })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({
    example: { 
      hemoglobin: '12.3 g/dL',
      glucose: '90 mg/dL',
      notes: 'Results within normal range' 
    },
    description: 'Resultados que se dieron durante el examen',
  })
  @IsObject() // <-- Cambia esto
  resultProperties?: InputJsonValue;

  @ApiProperty({
    example: '',
    description: 'Observaciones durante el examen',
  })
  @IsString()
  observation?: string;

  @ApiProperty({
    example: '1',
    description: 'Id del historial médico',
  })
  @IsNotEmpty()
  @IsNumber()
  medicHistoryId: number;

  @ApiProperty({
    example: '1',
    description: 'Id del catalogo',
  })
  @IsNotEmpty()
  @IsNumber()
  medicTestCatalogId: number;
}

/*
  @ApiProperty({ example: '2025-06-14T00:00:00Z', description: 'Fecha de solicitud en formato ISO 8601' })
  @IsNotEmpty()
  @IsDateString() // Valida que la cadena sea una fecha válida (e.g., 'YYYY-MM-DD' o ISO 8601)
  requestedAt: string;

  @ApiProperty({ example: '2025-06-14T00:00:00Z', description: 'Fecha de solicitud en formato ISO 8601' })
  @IsDateString() // Valida que la cadena sea una fecha válida (e.g., 'YYYY-MM-DD' o ISO 8601)
  completedAt: string;

  @ApiProperty({ example: State.PENDING, enum: State })
  @IsEnum(State)
  state: State;
*/