// src/user/dto/create-user-with-role-id.dto.ts
import { CreateUserDto } from '../system-user/dto/create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateUserWithRoleIdDto extends CreateUserDto {
  @ApiProperty({
    description:
      'ID del rol existente que se asignará al usuario en el laboratorio',
    example: 2,
  })
  @IsInt()
  @Min(1)
  roleId: number;
}
