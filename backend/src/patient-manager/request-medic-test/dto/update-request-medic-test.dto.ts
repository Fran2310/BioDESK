// update-patient.dto.ts
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateRequestMedicTestDto } from "./create-request-medic-test.dto";
import { IsEnum } from "class-validator";

import { Priority } from '@prisma/client-lab';

// Esto permite que el DTO pueda contener partes opcionales
export class UpdateRequestMedicTest extends PartialType(
    OmitType(CreateRequestMedicTestDto, [
      'medicHistoryId',
      'medicTestCatalogId',
    ] as const) // Elimina patientId del DTO
  ) {
}