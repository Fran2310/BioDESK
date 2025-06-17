// src/catalog-lab/dto/update-medic-test.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMedicTestDto } from './create-medic-test.dto';

export class UpdateMedicTestDto extends PartialType(CreateMedicTestDto) {}
