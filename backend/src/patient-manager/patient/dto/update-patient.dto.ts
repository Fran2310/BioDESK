// update-patient.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreatePatientDto } from "./create-patient.dto";

// Esto permite que el DTO pueda contener partes opcionales
export class UpdatePatientDto extends PartialType(CreatePatientDto) {} 