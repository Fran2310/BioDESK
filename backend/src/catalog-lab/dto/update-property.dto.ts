import { PartialType } from '@nestjs/swagger';
import { MedicTestPropertyDto } from './property.dto';

export class UpdateMedicTestPropertyDto extends PartialType(
  MedicTestPropertyDto,
) {}
