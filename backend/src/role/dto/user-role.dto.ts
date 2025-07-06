// src/role/dto/user-role.dto.ts
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RoleDto } from './role.dto';

export class UserRoleDto extends PartialType(RoleDto) {
  @ApiProperty({ example: 2, description: 'ID numérico del rol asignado' })
  id: number;
}
