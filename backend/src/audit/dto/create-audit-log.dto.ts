// src/audit/dto/create-audit-log.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ example: 'update' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'El paciente Juan Pérez fue modificado' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({ example: 'Patient' })
  @IsString()
  @IsNotEmpty()
  entity: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  recordEntityId: string;

  @ApiProperty({
    example: { before: { name: 'Juan' }, after: { name: 'Juan Carlos' } },
  })
  operationData: Record<string, any>;
}
