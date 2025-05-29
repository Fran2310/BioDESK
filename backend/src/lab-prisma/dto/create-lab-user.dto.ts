// /src/lab-prisma/dto/create-lab-user.dto.ts
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsDefined,
  IsUUID,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

export class CreateLabUserDto {
  @IsUUID()
  systemUserUuid: string;

  @ValidateNested()
  @Type(() => RoleDto)
  @IsDefined()
  role: RoleDto;
}
