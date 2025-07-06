// src/role/dto/update-role.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { RoleDto, PermissionDto } from './role.dto';
import { IsOptional, ValidateIf } from 'class-validator';
import {
  ApiPropertyOptional,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
/**
 * DTO para actualizar roles. Extiende RoleDto con todos los campos opcionales.
 * Valida que al menos uno de los campos (name, description, permissions) sea proporcionado.
 * Utiliza decoradores de validación para asegurar la integridad de los datos.
 */

@ApiExtraModels(PermissionDto)
export class UpdateRoleDto extends PartialType(RoleDto) {
  @ApiPropertyOptional({
    description: 'Nuevo nombre del rol',
    example: 'Tecnico de laboratorio',
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción del rol',
    example: 'Técnico de laboratorio con permisos limitados',
  })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Permisos actualizados del rol',
    type: [PermissionDto],
  })
  @IsOptional()
  permissions?: RoleDto['permissions'];
}
