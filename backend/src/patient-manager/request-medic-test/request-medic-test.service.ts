import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
import { MedicHistoryService } from '../medic-history/medic-history.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { intelligentSearch } from 'src/common/services/intelligentSearch.service';
import { AgeGroup, Gender, Priority, State } from '@prisma/client-lab';

import { STATE_TRANSITIONS } from 'src/casl/helper/transition.helper';
import { LabService } from 'src/lab/services/lab.service';

@Injectable()
export class RequestMedicTestService {
  private readonly logger = new Logger(RequestMedicTestService.name);
  
  constructor(
      private readonly systemUserService: SystemUserService,
      private readonly labService: LabService,
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
    includeData: boolean,
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

      // Opciones para omitir campos según el parámetro 'includeData'
      const omitFields = {
        resultProperties: !includeData,
        observation: !includeData,
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
            searchOptions,  // 2. El término de búsqueda
            searchTerm, // 3. Los campos donde buscar
            searchFields // 4. Las opciones (where, skip, take, omit, etc.)
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
    includeData: boolean,
    searchTerm?: string,
    searchFields?: string[],
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
  
      // El modelo principal para la búsqueda es 'requestMedicTest', no 'medicHistory'
      const requestMedicTestModel = labPrisma.requestMedicTest;
  
      // Opciones para omitir campos según el parámetro 'includeData'
      const omitFields = {
        resultProperties: !includeData,
        observation: !includeData,
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
        searchOptions,         // 2. El término de búsqueda 
        searchTerm,            // 3. Los campos donde buscar
        searchFields,          // 4. Las opciones (skip, take, omit, orderBy, enumFields)
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

async getReportData( // TODO Esta función se podría pasar al PdfService o a un submodulo para eso
  labId: number,
  requestMedicTestId: number,
): Promise<any> {
  try {
    // --- 1. OBTENCIÓN DE DATOS CRUDOS ---
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
    
    const [lab, requestWithRelations] = await Promise.all([
      this.labService.getLabById(labId),
      labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId, state: 'COMPLETED' },
        include: {
          medicHistory: { include: { patient: true } },
          medicTestCatalog: { include: { properties: { include: { valueReferences: true } } } },
        },
      }),
    ]);

    if (!requestWithRelations) {
      throw new NotFoundException(`Examen médico completado con ID ${requestMedicTestId} no fue encontrado.`);
    }

    // --- 2. EXTRACCIÓN Y CÁLCULOS (CON MANEJO DE NULOS) ---

    const patient = requestWithRelations.medicHistory.patient;
    if (!patient) {
      throw new NotFoundException(`No se encontró el paciente asociado a la solicitud de examen.`);
    }

    // Declaramos las variables que pueden depender de la fecha de nacimiento
    let patientAge: number | null = null;
    let patientAgeGroup: AgeGroup = AgeGroup.ANY; // Default a 'ANY' para máxima compatibilidad

    // **CAMBIO CLAVE 1: Manejo de birthDate nulo**
    // Solo calculamos la edad si la fecha de nacimiento existe
    if (patient.birthDate) {
      patientAge = this.calculateAge(patient.birthDate);
      // Solo asignamos un grupo específico si la edad fue calculada
      if (patientAge !== null) {
          patientAgeGroup = patientAge >= 18 ? AgeGroup.ADULT : AgeGroup.CHILD;
      }
    }
    
    // --- 3. PROCESAMIENTO DE RESULTADOS (CON MANEJO DE NULOS) ---

    const results = requestWithRelations.medicTestCatalog.properties.map((prop) => {
      // **CAMBIO CLAVE 2: Manejo de resultProperties nulo**
      // Usamos el operador de encadenamiento opcional (?.) para evitar errores si resultProperties es null.
      // Si es null o la propiedad específica no existe, usamos 'N/A'.
      const resultValue = requestWithRelations.resultProperties?.[prop.name] ?? 'N/A';
      
      const referenceRange = this.findReferenceRange(
        prop.valueReferences,
        patient.gender,
        patientAgeGroup, // Usamos el ageGroup calculado (o el default 'ANY')
      );

      return {
        propertyName: prop.name,
        value: resultValue,
        unit: prop.unit ?? '',
        referenceRange,
      };
    });

    // --- 4. CONSTRUCCIÓN DEL OBJETO FINAL PARA LA PLANTILLA ---

    const reportData = {
      lab: {
        name: lab.name,
        rif: lab.rif,
        dir: lab.dir,
        phoneNums: lab.phoneNums,
        logoPath: lab.logoPath,
      },
      patient: {
        fullName: `${patient.name} ${patient.lastName}`,
        ci: patient.ci,
        // Mostramos la edad o un texto alternativo si no se pudo calcular
        age: patientAge !== null ? `${patientAge} años` : 'No especificada',
        gender: patient.gender,
        email: patient.email,
      },
      request: {
        id: requestWithRelations.id,
        // Agregamos una verificación para completedAt
        completedAtFormatted: requestWithRelations.completedAt
          ? requestWithRelations.completedAt.toLocaleDateString('es-VE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Pendiente', // O el texto que prefieras si es null
        medicTestName: requestWithRelations.medicTestCatalog.name,
        observation: requestWithRelations.observation,
      },
      results,
    };

    return reportData;

  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error(`Error al generar los datos del reporte: ${error.message}`, error.stack);
    throw new InternalServerErrorException(`Ocurrió un error inesperado al procesar la solicitud del reporte.`);
  }
}

// --- Helpers ---
  private calculateAge(birthDate: Date | null): number | null {
    // Si la fecha es nula, devolvemos null inmediatamente.
    if (!birthDate) return null;
    
    const today = new Date("2025-06-26T04:05:19.000Z"); // Hora actual para consistencia
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private findReferenceRange(references: any[], gender: Gender, ageGroup: AgeGroup): string {
      const specificMatch = references.find(
        (ref) => ref.gender === gender && ref.ageGroup === ageGroup,
      );
      if (specificMatch) return specificMatch.range;

      const anyGenderMatch = references.find(
        (ref) => ref.gender === Gender.ANY && ref.ageGroup === ageGroup,
      );
      if (anyGenderMatch) return anyGenderMatch.range;
      
      const anyAgeMatch = references.find(
        (ref) => ref.gender === gender && ref.ageGroup === AgeGroup.ANY,
      );
      if (anyAgeMatch) return anyAgeMatch.range;

      const fallback = references.find(
        (ref) => ref.gender === Gender.ANY && ref.ageGroup === AgeGroup.ANY,
      );
      return fallback ? fallback.range : 'No disponible';
  }
}
