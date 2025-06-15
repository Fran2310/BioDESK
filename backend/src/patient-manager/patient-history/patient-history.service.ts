import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';

import { Patient } from '@prisma/client-lab';
import { CreatePatientHistoryDto } from './dto/create-patient-history.dto';
import { PatientService } from '../patient/patient.service';

@Injectable()
export class PatientHistoryService {
  private readonly logger = new Logger(PatientHistoryService.name);
  
  constructor(
      private readonly labPrismaFactory: LabPrismaFactory,
      private readonly systemUserService: SystemUserService,
      private readonly labService: LabService,
      private readonly patientService: PatientService,
      private readonly auditService: AuditService,
  ) {}
  
  async createPatientHistory(
    labId: number, 
    dto: CreatePatientHistoryDto, 
    performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})
      const patient = await this.patientService.getPatient(labId, dto.patientId)

      const history = await labPrisma.medicHistory.create({
        data: dto,
      });

      this.logger.log(
        `Historial del ${patient.name} ${patient.lastName} creado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} creó el historial médico para el paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'medicHistory',
        recordEntityId: history.id.toString(),
        operationData: {
          after: {
            history
          },
        },
      });

      return history;

    } catch (error) {
      this.logger.error(`Error al crear el historial del paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async createPatientHistoryByPatient(
    labId: number, 
    patient: Patient, 
    dto: CreatePatientHistoryDto, 
    performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})
      
      const history = await labPrisma.medicHistory.create({
        data: dto,
      });

      this.logger.log(
        `Historial del ${patient.name} ${patient.lastName} creado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} creó el historial médico para el paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'medicHistory',
        recordEntityId: history.id.toString(),
        operationData: {
          after: {
            history
          },
        },
      });

      return history;

    } catch (error) {
      this.logger.error(`Error al crear el historial del paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }
}
