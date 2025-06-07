// src/user/dto/assign-existing-user.dto.ts
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsUUID,
  IsEmail,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsNotEmpty,
  IsInt,
  IsPositive,
} from 'class-validator';

// Custom validator para aceptar solo uno de los campos
@ValidatorConstraint({ name: 'OnlyOneField', async: false })
export class OnlyOneFieldConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    const fields = [obj.uuid, obj.email, obj.ci];
    return fields.filter((f) => f !== undefined).length === 1;
  }

  defaultMessage() {
    return 'Debes proporcionar solo uno de los campos: uuid, email o ci';
  }
}

export class AssignExistingUserDto {
  @ApiPropertyOptional({ description: 'UUID del usuario' })
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @ApiPropertyOptional({ description: 'Email del usuario' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Cédula del usuario' })
  @IsString()
  @IsOptional()
  ci?: string;

  @ApiProperty({
    description: 'ID del rol a asignar al usuario dentro del laboratorio',
    example: 2,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10)) // Asegura transformación a número
  roleId: number;

  @ApiHideProperty()
  @Validate(OnlyOneFieldConstraint)
  validateOnlyOne: boolean = true;
}
