// update-patient.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateLabDto } from "./create-lab.dto";

// Esto permite que el DTO pueda contener partes opcionales
export class UpdateLabDto extends PartialType(CreateLabDto) {}  
// Ya se ignora el dbName desde el CreateLabDto