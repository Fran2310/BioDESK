// update-patient.dto.ts
import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateMedicHistoryDto } from "./create-medic-history.dto";

// Esto permite que el DTO pueda contener partes opcionales
export class UpdateMedicHistory extends PartialType(
    OmitType(CreateMedicHistoryDto, ['patientId'] as const) // Elimina patientId del DTO
  ) {}