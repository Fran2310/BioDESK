// /src/user/dto/system-user.dto.ts
import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { CreateLabDto } from './create-lab.dto';
import { Type } from 'class-transformer';

export class LabInfoDto extends CreateLabDto {
  @ApiProperty({
    example: 1,
    description: 'ID del laboratorio',
  })
  @IsInt()
  @IsNotEmpty()
  id: number;
}

export class SystemUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  @ApiProperty({
    example: 1,
    description: 'id del usuario',
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    example: '4c13de10-a4d5-4e....',
    description: 'uuid del usuario',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    type: [LabInfoDto],
    description: 'Laboratorios asociados al usuario',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LabInfoDto)
  labs?: LabInfoDto[];
}
