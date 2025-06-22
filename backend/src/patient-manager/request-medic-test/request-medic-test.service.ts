import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
import { MedicHistoryService } from '../medic-history/medic-history.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';

@Injectable()
export class RequestMedicTestService {
  private readonly logger = new Logger(RequestMedicTestService.name);
  
  constructor(
      private readonly systemUserService: SystemUserService,
      private readonly medicHistory: MedicHistoryService,
      private readonly auditService: AuditService,
      private readonly labDbManageService: LabDbManageService,
  ) {}
  
  async createRequestMedicTest(
    labId: number, 
    dto: CreateRequestMedicTestDto,  // Asegúrate que el DTO incluya patientId
    performedByUserUuid: string
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({ uuid: performedByUserUuid });
  
      // 1. Obtener el historial médico con el paciente relacionado
      const medicHistoryWithPatient = await labPrisma.medicHistory.findUnique({
        where: { id: dto.medicHistoryId },
        include: {
          patient: true
        }
      });

      if (!medicHistoryWithPatient) {
        throw new NotFoundException(`Historial médico con ID ${dto.medicHistoryId} no encontrado`);
      }

      const patient = medicHistoryWithPatient.patient;
  
      const medicTest = await labPrisma.requestMedicTest.create({
        data: {
          ...dto, // Incluye todos los campos del DTO
          requestedAt: new Date().toISOString(),
        },
      });
  
      // 3. Log y auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        entity: 'requestMedicTest',
        recordEntityId: medicTest.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} creó un examen médico para el paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: {
          after: medicTest // Envía el objeto completo para auditoría
        },
      });
  
      return medicTest;
  
    } catch (error) {
      this.logger.error(`Error al crear examen médico: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Error al crear el examen médico');
    }
  }

  async getAllRequestsMedicTestFromOne(
    labId: number,
    limit: number,
    offset: number,
    all_data: boolean, 
    medicHistoryId: number) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      
      // Validamos que al menos tengamos uno de los dos identificadores
      if (!medicHistoryId) {
        throw new ConflictException(
          'Debes proporcionar al menos uno: medicHistoryId.',
        );
      }

      const where = {
        ...(medicHistoryId && { id: medicHistoryId }),
      };

      const selectFieldsToOmitInMedicTests = {
        resultProperties: !all_data,
        observation: !all_data,
      }

      const [total, data] = await Promise.all([
        await labPrisma.medicHistory.count(),
        await labPrisma.medicHistory.findFirst({
          where,
          include: {
            requestMedicTests: {
              omit: selectFieldsToOmitInMedicTests,
              skip: offset,          // Paginación: salta los primeros 'offset' registros
              take: limit,           // Paginación: limita a 'limit' registros
              orderBy: {            // Ordenamiento recomendado para paginación consistente
                requestedAt: 'desc' // o 'id' si prefieres
              }
            },
          }
        })  
      ])

      return {
        total,
        offset,
        limit,
        data,
      };  

    } catch (error) {
      this.logger.error(`Error al obtener los examenes del paciente: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async getAllRequestsMedicTestFromAll(
    labId: number,
    limit: number,
    offset: number,
    all_data: boolean) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const selectFieldsToOmitInMedicTests = {
        resultProperties: !all_data,
        observation: !all_data,
      }

      const [total, data] = await Promise.all([
        await labPrisma.medicHistory.count(),
        await labPrisma.medicHistory.findMany({
          include: {
            requestMedicTests: {
              omit: selectFieldsToOmitInMedicTests,
              skip: offset,          // Paginación: salta los primeros 'offset' registros
              take: limit,           // Paginación: limita a 'limit' registros
              orderBy: {            // Ordenamiento recomendado para paginación consistente
                requestedAt: 'desc' // o 'id' si prefieres
              }
            },
          }
        }) 
      ])

      return {
        total,
        offset,
        limit,
        data,
      };  

    } catch (error) {
      this.logger.error(`Error al obtener los examenes del paciente: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async getRequestMedicTest(labId: number, requestMedicTestId: number) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

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
    dto: UpdateRequestMedicTest, 
    performedByUserUuid: string
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({ uuid: performedByUserUuid });
  
      // Obtener el request incluyendo el paciente relacionado
      const requestWithPatient = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            include: {
              patient: true // Trae todos los datos del paciente
            }
          }
        }
      });
  
      if (!requestWithPatient) {
        throw new NotFoundException(`Examen médico con ID ${requestMedicTestId} no encontrado`);
      }
  
      const patient = requestWithPatient.medicHistory.patient;
      // Actualización del request
      const updated = await labPrisma.requestMedicTest.update({
        where: { id: requestMedicTestId },
        data: {
          resultProperties: dto.resultProperties,
          observation: dto.observation,
        } 
      });
      
      // Auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        entity: 'requestMedicTest',
        recordEntityId: updated.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} actualizó el historial médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: {
          before: requestWithPatient,
          after: updated,
        },
      });
  
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar examen médico: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async deleteRequestMedicTest(
    labId: number, 
    requestMedicTestId: number,
    performedByUserUuid: string, 
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({ uuid: performedByUserUuid });
  
      // 1. Obtener el examen médico con los datos completos del paciente
      const requestWithPatient = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            include: {
              patient: true // Incluye todos los datos del paciente
            }
          }
        }
      });
  
      if (!requestWithPatient) {
        throw new NotFoundException(`Examen con ID ${requestMedicTestId} no encontrado`);
      }
  
      const patient = requestWithPatient.medicHistory.patient;
  
      // 2. Eliminar el examen
      const deletedRequest = await labPrisma.requestMedicTest.delete({
        where: { id: requestMedicTestId },
      });
  
      // 3. Auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'delete',
        entity: 'requestMedicTest',
        recordEntityId: deletedRequest.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} eliminó un examen del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: { before: requestWithPatient },
      });
  
      return deletedRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar examen: ${error.message}`);
      throw new ConflictException('Error al eliminar el examen');
    }
  }
}
