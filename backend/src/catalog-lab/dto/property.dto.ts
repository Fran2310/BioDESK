// src/medic-test/dto/property.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValueReferenceDto } from './value-ref.dto';

export class MedicTestPropertyDto {
  @ApiProperty({ example: 'Hematocrito' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '%' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ type: [ValueReferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueReferenceDto)
  valuesReferences?: ValueReferenceDto[];
}
