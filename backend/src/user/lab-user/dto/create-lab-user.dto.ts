// /src/lab-prisma/dto/create-lab-user.dto.ts
import { ValidateNested, IsDefined, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleDto } from '../../../role/dto/role.dto';

export class CreateLabUserDto {
  @IsUUID()
  systemUserUuid: string;

  @ValidateNested()
  @Type(() => RoleDto)
  @IsDefined()
  role: RoleDto;
}
