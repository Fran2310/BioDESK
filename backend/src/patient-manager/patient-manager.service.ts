import { Injectable, Logger } from '@nestjs/common';
import { CreatePatientDto } from './patient/dto/create-patient.dto';
import { CreatePatientHistoryDto } from './patient-history/dto/create-patient-history.dto';
import { PatientService } from './patient/patient.service';
import { PatientHistoryService } from './patient-history/patient-history.service';

@Injectable()
export class PatientManagerService {  
  constructor(
    private readonly patientService: PatientService,
    private readonly patientHistoryService: PatientHistoryService,
  ) {}

  async createPatientWithHistory(
    labId: number, 
    patientDto: CreatePatientDto, 
    historyDto: CreatePatientHistoryDto, 
    performedByUserUuid) {
    const newPatient = await this.patientService.createPatient(
      labId, 
      patientDto, 
      performedByUserUuid
    );
    const patientHistory = await this.patientHistoryService.createPatientHistoryByPatient(
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
