// /src/role/dto/role.dto.ts
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({
    description: 'Acciones permitidas separadas por coma',
    example: 'read,update',
  })
  @IsNotEmpty()
  @IsString()
  actions: string;

  @ApiProperty({
    description: 'Entidad (subject) sobre la cual se aplican las acciones',
    example: 'RequestMedicTest',
  })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description:
      'Campos específicos afectados por la acción (opcional). Puede ser "*" para indicar todos o una lista separada por coma para campos específicos (revisar esquemas DBs para más detalles)',
    example: 'status,results',
    required: false,
  })
  @IsOptional()
  @IsString()
  fields?: string;
}

export class RoleDto {
  @ApiProperty({
    description: 'Nombre único del rol',
    example: 'Personal de laboratorio',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example:
      'Personal del laboratorio con permisos de lectura y actualizacion para gestionar RequestMedicTest',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'Listado de permisos asociados al rol, mayor información sobre cuales enviar consultar los esquemas de las DBs o el archivo backend/src/casl/ability.type.ts',
    type: [PermissionDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true }) // Valida cada objeto en el array
  @Type(() => PermissionDto) // Transforma cada item a instancia de PermissionDto
  permissions: PermissionDto[];
}
