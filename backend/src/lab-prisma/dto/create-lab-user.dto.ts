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

export class PermissionDto {
  @IsNotEmpty()
  @IsString()
  actions: string; // Ej: "update" o "read,update"

  @IsNotEmpty()
  @IsString()
  subject: string; // Ej: "RequestMedicTest"

  @IsOptional()
  @IsString()
  fields?: string; // Opcional, puede ser "*" o lista "campo1,campo2"
}

export class RoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true }) // Valida cada objeto en el array
  @Type(() => PermissionDto) // Transforma cada item a instancia de PermissionDto
  permissions: PermissionDto[];
}

export class CreateLabUserDto {
  @IsUUID()
  systemUserUuid: string;

  @ValidateNested()
  @Type(() => RoleDto)
  @IsDefined()
  role: RoleDto;
}
