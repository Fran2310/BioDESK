import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { LabPrismaService } from 'src/prisma-manage/lab-prisma/services/lab-prisma.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';

import { Patient } from '@prisma/client-lab';
import { CreateMedicHistoryDto } from './dto/create-medic-history.dto';
import { PatientService } from '../patient/patient.service';

@Injectable()
export class MedicHistoryService {
  private readonly logger = new Logger(MedicHistoryService.name);
  
  constructor(
      private readonly labPrismaFactory: LabPrismaFactory,
      private readonly systemUserService: SystemUserService,
      private readonly labService: LabService,
      private readonly patientService: PatientService,
      private readonly auditService: AuditService,
  ) {}
  
  async createMedicHistory(
    labId: number, 
    dto: CreateMedicHistoryDto, 
    performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      await this.verifyPatientHasNoMedicalHistory(labPrisma, dto.patientId)

      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid});
      const patient = await this.patientService.getPatient(labId, dto.patientId);

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

  async createMedicHistoryByPatient(
    labId: number, 
    patient: Patient, 
    dto: CreateMedicHistoryDto, 
    performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      await this.verifyPatientHasNoMedicalHistory(labPrisma, dto.patientId)

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

  private async verifyPatientHasNoMedicalHistory(
    labPrisma: LabPrismaService,
    patientId: number
  ): Promise<void> { // Cambiamos el retorno a void ya que lanzará excepción si existe
    try {
      const existingHistory = await labPrisma.medicHistory.findFirst({
        where: { patientId },
        select: { id: true },
      });
  
      if (existingHistory) {
        throw new ConflictException('El paciente ya tiene asignado un historial médico');
      }
      
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Preservar el error original de conflicto
      }
      
      this.logger.error(
        `Error al verificar historial médico: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'Error al verificar historial médico existente'
      );
    }
  }
}
