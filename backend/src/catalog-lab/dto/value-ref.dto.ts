// src/medic-test/dto/value-ref.dto.ts
import { IsEnum, IsString } from 'class-validator';
import { Gender, AgeGroup } from '@prisma/client-lab';
import { ApiProperty } from '@nestjs/swagger';

export class ValueReferenceDto {
  @ApiProperty({ example: '36.0 - 48.6' })
  @IsString()
  range: string;

  @ApiProperty({ example: Gender.ANY, enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: AgeGroup.ADULT, enum: AgeGroup })
  @IsEnum(AgeGroup)
  ageGroup: AgeGroup;
}
