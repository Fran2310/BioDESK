import { ApiProperty, PartialType } from '@nestjs/swagger';
import { MedicTestPropertyDto } from './property.dto';
import { IsInt } from 'class-validator';

export class UpdateMedicTestPropertyDto extends PartialType(
  MedicTestPropertyDto,
) {}
