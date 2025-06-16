import { Injectable, Logger } from '@nestjs/common';
import { CreatePatientDto } from './patient/dto/create-patient.dto';
import { CreateMedicHistoryDto } from './medic-history/dto/create-medic-history.dto';
import { PatientService } from './patient/patient.service';
import { MedicHistoryService } from './medic-history/medic-history.service';

@Injectable()
export class PatientManagerService {  
  constructor(
    private readonly patientService: PatientService,
    private readonly patientHistoryService: MedicHistoryService,
  ) {}

  async createPatientWithHistory(
    labId: number, 
    patientDto: CreatePatientDto, 
    historyDto: CreateMedicHistoryDto, 
    performedByUserUuid) {
    const newPatient = await this.patientService.createPatient(
      labId, 
      patientDto, 
      performedByUserUuid
    );
    const patientHistory = await this.patientHistoryService.createMedicHistoryByPatient(
      labId,
      newPatient,
      historyDto,
      performedByUserUuid
    );

    return {
      patient: newPatient,
      history: patientHistory,
    } 
  }
}
