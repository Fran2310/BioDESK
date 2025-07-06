// src/medic-test/dto/create-medic-test.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MedicTestPropertyDto } from './property.dto';

export class CreateMedicTestDto {
  @ApiProperty({ example: 'Hemograma' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Análisis de sangre para evaluar hematocritos',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: ['Tubo EDTA', 'Guantes'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  supplies: string[];

  @ApiProperty({ type: [MedicTestPropertyDto] })
  @ValidateNested({ each: true })
  @Type(() => MedicTestPropertyDto)
  properties: MedicTestPropertyDto[];
}
