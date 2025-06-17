import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { LabPrismaService } from 'src/prisma-manage/lab-prisma/services/lab-prisma.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';

import { PatientService } from '../patient/patient.service';
import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
import { MedicHistoryService } from '../medic-history/medic-history.service';

@Injectable()
export class RequestMedicTestService {
  private readonly logger = new Logger(RequestMedicTestService.name);
  
  constructor(
      private readonly labPrismaFactory: LabPrismaFactory,
      private readonly systemUserService: SystemUserService,
      private readonly labService: LabService,
      private readonly patientService: PatientService,
      private readonly medicHistory: MedicHistoryService,
      private readonly auditService: AuditService,
  ) {}
  
  async createRequestMedicTest(
    labId: number, 
    patientId: number,
    dto: CreateRequestMedicTestDto, 
    performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid});
      const patient = await this.patientService.getPatient(labId, patientId);

      const medicTest = await labPrisma.requestMedicTest.create({
        data: dto,
      });

      this.logger.log(
        `Historial del ${patient.name} ${patient.lastName} creado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} creó una petición de examen médico para el paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'requestMedicTest',
        recordEntityId: medicTest.id.toString(),
        operationData: {
          after: {
            medicTest
          },
        },
      });

      return medicTest;

    } catch (error) {
      this.logger.error(`Error al crear una petición de examen para el paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async getAllRequestsMedicTestFromOne(labId: number, all_data: boolean, medicHistoryId?: number, patientId?: number) {
    try {

      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      
      // Si no tenemos medicHistoryId pero tenemos patientId, intentamos obtenerlo
    if (!medicHistoryId && patientId) {
        const medicHistory = await this.medicHistory.getMedicHistory(labId, false, patientId);
        if (medicHistory) {
          medicHistoryId = medicHistory.id;
        }
      }
  
      // Validamos que al menos tengamos uno de los dos identificadores
      if (!medicHistoryId && !patientId) {
        throw new ConflictException(
          'Debes proporcionar al menos uno: medicHistoryId o patientId.',
        );
      }

      const where = {
        ...(medicHistoryId && { id: medicHistoryId }),
      };

      const selectFieldsToOmitInMedicTests = {
        resultProperties: !all_data,
        observation: !all_data,
      }

      return await labPrisma.medicHistory.findFirst({
        where,
        include: {
          requestMedicTests: {
            omit: selectFieldsToOmitInMedicTests
          },
        }
      }) 

    } catch (error) {
      this.logger.error(`Error al obtener los examenes del paciente: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async getRequestMedicTest(labId: number, all_data: boolean, requestMedicTestId: number) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      const where = {
        ...(requestMedicTestId && { id: requestMedicTestId }),
      };

      return await labPrisma.requestMedicTest.findFirst({
        where,
      })

    } catch (error) {
      this.logger.error(`Error al obtener los historiales de los pacientes: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async updateRequestMedicTest(
    labId: number, 
    requestMedicTestId: number,
    patientId: number,
    dto: UpdateRequestMedicTest, 
    performedByUserUuid, 
    ) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})
      
      // Verificar existencia del historial
      const before = await this.getRequestMedicTest(labId, false, requestMedicTestId)
      if (!before) {
        throw new NotFoundException(`Examen médico no encontrado para el paciente ${patientId}`);
      }

      const patient = await this.patientService.getPatient(labId, patientId);

      this.logger.log(
        `Examen del paciente ${patient.name} ${patient.lastName} actualizado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      const updated = await labPrisma.requestMedicTest.update({
        where: { id: requestMedicTestId },
        data: {
          resultProperties: dto.resultProperties,
          observation: dto.observation,
        } 
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        entity: 'requestMedicTest',
        recordEntityId: updated.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} actualizó el historial médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        operationData: {
          before,
          after: updated,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async deleteRequestMedicTest(
    labId: number, 
    requestMedicTestId: number,
    patientId: number,
    performedByUserUuid: string, 
  ) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({ uuid: performedByUserUuid });
  
      // 1. Verificar primero si el paciente existe
      const patient = await this.patientService.getPatient(labId, patientId);
      if (!patient) {
        throw new NotFoundException(`Paciente con ID ${patientId} no encontrado`);
      }
  
      // 2. Obtener el examen junto con su medicHistory (incluyendo patientId)
      const before = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            select: {
              patientId: true
            }
          }
        }
      });
  
      if (!before) {
        throw new NotFoundException(`Examen con ID ${requestMedicTestId} no encontrado`);
      }
  
      // 3. Validar que el examen pertenezca al paciente a través de medicHistory
      if (before.medicHistory.patientId !== patientId) {
        throw new ConflictException(`El examen no pertenece al paciente ${patientId}`);
      }
  
      // 4. Proceder con la eliminación
      const deletedRequestMedicTest = await labPrisma.requestMedicTest.delete({
        where: { id: before.id },
      });
  
      // Auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'delete',
        entity: 'requestMedicTest',
        recordEntityId: deletedRequestMedicTest.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} eliminó un examen del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: { before: deletedRequestMedicTest },
      });
  
      return deletedRequestMedicTest; 
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error al eliminar un examen: ${error.message}`);
      throw new ConflictException('Error al eliminar el examen');
    }
  }
}
