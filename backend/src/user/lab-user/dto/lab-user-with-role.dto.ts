// src/lab-user/dto/lab-user-with-role.dto.ts
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { RoleDto } from 'src/role/dto/role.dto';

export class LabUserRoleDto extends PartialType(
  OmitType(RoleDto, ['permissions']),
) {
  @ApiProperty({ description: 'ID del rol', example: 2 })
  id: number;

  @ApiProperty({
    description:
      'Listado de permisos (si se solicita). Este campo es opcional según el contexto.',
    required: false,
  })
  permissions?: any; // puedes tiparlo más si lo necesitas
}

export class LabUserListItem {
  @ApiProperty({
    description: 'UUID del usuario en la DB del sistema',
    example: 'c4e0341a-5d9b-4e9.....',
  })
  systemUserUuid: string;

  @ApiPropertyOptional({ type: () => LabUserRoleDto })
  role?: LabUserRoleDto;
}

export class PaginatedLabUserListDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty({ type: [LabUserListItem] })
  data: LabUserListItem[];
}
