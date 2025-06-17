// update-patient.dto.ts
import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateRequestMedicTestDto } from "./create-request-medic-test.dto";

// Esto permite que el DTO pueda contener partes opcionales
export class UpdateRequestMedicTest extends PartialType(
    OmitType(CreateRequestMedicTestDto, [
      'requestedAt',
      'completedAt',
      'state',
      'priority',
      'medicHistoryId',
      'medicTestCatalogId',
    ] as const) // Elimina patientId del DTO
  ) {}