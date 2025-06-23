import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
import { MedicHistoryService } from '../medic-history/medic-history.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { intelligentSearch } from 'src/common/services/intelligentSearch.service';
import { Priority, State } from '@prisma/client-lab';

import { STATE_TRANSITIONS } from 'src/casl/helper/transition.helper';

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
    medicHistoryId: number,
    searchTerm?: string,
    searchFields?: string[],
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

      // La validación del medicHistoryId sigue siendo crucial
      if (!medicHistoryId) {
        throw new ConflictException('El ID del historial médico (medicHistoryId) es requerido.');
      }

      // El modelo sobre el que vamos a buscar es 'requestMedicTest'
      const requestMedicTest = labPrisma.requestMedicTest;

      // Opciones para omitir campos según el parámetro 'all_data'
      const omitFields = {
        resultProperties: !all_data,
        observation: !all_data,
      };

      // Construimos el objeto de opciones para la búsqueda
      const searchOptions = {
        skip: offset,
        take: limit,
        omit: omitFields,
        // Este 'where' es fundamental para filtrar solo los exámenes de un historial médico
        where: {
          medicHistoryId: medicHistoryId,
        },
        enumFields: {
          state: State,
          priority: Priority,
        }
      };

      // Lógica principal: usar intelligentSearch si hay un término de búsqueda
      const { results: data, total } = await intelligentSearch(
          requestMedicTest, // 1. El modelo a buscar
            searchTerm,  // 2. El término de búsqueda
            searchFields, // 3. Los campos donde buscar
            searchOptions // 4. Las opciones (where, skip, take, omit, etc.)
      )

      return {
        total,
        offset,
        limit,
        data,
      };

    } catch (error) {
      this.logger.error(`Error al obtener los exámenes del paciente: ${error.message}`);
      // Lanza la excepción original si ya es una de las nuestras (ej: ConflictException)
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      // Envuelve otros errores en un NotFoundException genérico
      throw new NotFoundException(`Error al obtener los exámenes: ${error.message}`);
    }
  }

  async getAllRequestsMedicTestFromAll(
    labId: number,
    limit: number,
    offset: number,
    all_data: boolean,
    searchTerm?: string,
    searchFields?: string[],
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
  
      // El modelo principal para la búsqueda es 'requestMedicTest', no 'medicHistory'
      const requestMedicTestModel = labPrisma.requestMedicTest;
  
      // Opciones para omitir campos según el parámetro 'all_data'
      const omitFields = {
        resultProperties: !all_data,
        observation: !all_data,
      };

  
      // Construimos el objeto de opciones para la búsqueda inteligente
      const searchOptions = {
        skip: offset,
        take: limit,
        omit: omitFields,
        orderBy: {
          requestedAt: 'desc', // O 'id' si prefieres, para una paginación consistente
        },
        // Si tienes enums en tu modelo RequestMedicTest y quieres que intelligentSearch los maneje:
        enumFields: {
          state: State,
          priority: Priority,
        }
      };
  
      // Lógica principal: usar intelligentSearch
      // Esta función ahora buscará directamente en el modelo requestMedicTest
      // sin el filtro de medicHistoryId específico.
      const { results: data, total } = await intelligentSearch(
        requestMedicTestModel, // 1. El modelo a buscar (requestMedicTest directamente)
        searchTerm,           // 2. El término de búsqueda
        searchFields, // 3. Los campos donde buscar
        searchOptions         // 4. Las opciones (skip, take, omit, orderBy, enumFields)
      );
  
      return {
        total,
        offset,
        limit,
        data,
      };
  
    } catch (error) {
      this.logger.error(`Error al obtener todos los exámenes médicos: ${error.message}`);
      // Lanza la excepción original si ya es una de las nuestras
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      // Envuelve otros errores en un NotFoundException genérico
      throw new NotFoundException(`Error al obtener todos los exámenes médicos: ${error.message}`);
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
        details: `El usuario ${systemUser.name} ${systemUser.lastName} actualizó un examen médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
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

  async changeStateRequestMedicTest(
    labId: number, 
    requestMedicTestId: number,
    state: State,
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

      // Verificar si la transción es válida
      for (const [currentState, possibleTransitions] of Object.entries(STATE_TRANSITIONS)) { 
        if (currentState === requestWithPatient?.state) {
          if (!possibleTransitions.includes(state as State)) {
            throw new ForbiddenException(`No se puede cambiar el estado de ${currentState} a ${state}`);
          } 
        }
      }
  
      const patient = requestWithPatient.medicHistory.patient;
      // Actualización del request
      const updated = await labPrisma.requestMedicTest.update({
        where: { id: requestMedicTestId },
        data: {
          state
        } 
      });
      
      // Auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        entity: 'requestMedicTest',
        recordEntityId: updated.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} cambió el estado de un examen médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: {
          before: requestWithPatient.state,
          after: updated.state,
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
}
