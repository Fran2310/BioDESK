import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';
import { intelligentSearch } from 'src/common/utils/intelligentSearch';
import { Priority, State } from '@prisma/client-lab';

import { STATE_TRANSITIONS } from 'src/casl/helper/transition.helper';
import { LabUserService } from 'src/user/lab-user/lab-user.service';
import { PdfService } from 'src/pdf/services/pdf.service';
import { MailService } from 'src/mail/mail.service';
import { LabService } from 'src/lab/services/lab.service';
import { StorageService } from 'src/storage/services/storage.service';

@Injectable()
export class RequestMedicTestService {
  private readonly logger = new Logger(RequestMedicTestService.name);

  constructor(
    private readonly systemUserService: SystemUserService,
    private readonly labUserService: LabUserService,
    private readonly labService: LabService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Crea una nueva solicitud de examen médico para un paciente en un laboratorio específico.
   *
   * @param labId - ID del laboratorio donde se realiza la solicitud.
   * @param dto - Datos de la solicitud del examen médico.
   * @param performedByUserUuid - UUID del usuario que realiza la acción.
   * @returns La solicitud de examen médico creada.
   * @throws NotFoundException Si no se encuentra el historial médico asociado.
   * @throws ConflictException Si ocurre un error durante la creación de la solicitud.
   */
  async createRequestMedicTest(
    labId: number,
    dto: CreateRequestMedicTestDto,
    performedByUserUuid: string,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      // 1. Obtener el historial médico con el paciente relacionado
      const medicHistoryWithPatient = await labPrisma.medicHistory.findUnique({
        where: { id: dto.medicHistoryId },
        include: {
          patient: true,
        },
      });

      if (!medicHistoryWithPatient) {
        throw new NotFoundException(
          `Historial médico con ID ${dto.medicHistoryId} no encontrado`,
        );
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
          after: medicTest, // Envía el objeto completo para auditoría
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

  /**
   * Recupera una lista paginada de exámenes médicos asociados a un historial médico específico en un laboratorio.
   * Permite búsqueda inteligente y selección opcional de campos adicionales. El ID del historial médico es obligatorio.
   *
   * @param labId ID del laboratorio donde se realiza la búsqueda.
   * @param limit Número máximo de exámenes a retornar.
   * @param offset Número de exámenes a omitir (para paginación).
   * @param includeData Si es true, incluye campos adicionales (resultProperties, observation) y relaciones (medicTestCatalog, medicHistory con paciente).
   * @param medicHistoryId ID del historial médico del cual se obtendrán los exámenes (obligatorio).
   * @param searchTerm (Opcional) Término de búsqueda para filtrar exámenes.
   * @param searchFields (Opcional) Campos sobre los que aplicar la búsqueda.
   * @returns Un objeto con el total de exámenes encontrados, offset, límite y lista de exámenes.
   * @throws ConflictException Si no se proporciona el ID del historial médico (medicHistoryId).
   * @throws NotFoundException Si ocurre un error al obtener los exámenes.
   */
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
        throw new ConflictException(
          'El ID del historial médico (medicHistoryId) es requerido.',
        );
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
        include: includeData
          ? {
              medicTestCatalog: true,
              medicHistory: {
                // Esto se puede optimizar no enviando nada de este
                include: {
                  patient: true, // Esto se puede optimizar solo enviando unos cuantos datos del paciente
                },
              },
            }
          : undefined,
        // Este 'where' es fundamental para filtrar solo los exámenes de un historial médico
        where: {
          medicHistoryId: medicHistoryId,
        },
        enumFields: {
          state: State,
          priority: Priority,
        },
      };

      // Lógica principal: usar intelligentSearch si hay un término de búsqueda
      const { results: data, total } = await intelligentSearch(
        requestMedicTest, // 1. El modelo a buscar
        searchOptions, // 2. El término de búsqueda
        searchTerm, // 3. Los campos donde buscar
        searchFields, // 4. Las opciones (where, skip, take, omit, etc.)
      );

      return {
        total,
        offset,
        limit,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener los exámenes del paciente: ${error.message}`,
      );
      // Lanza la excepción original si ya es una de las nuestras (ej: ConflictException)
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Envuelve otros errores en un NotFoundException genérico
      throw new NotFoundException(
        `Error al obtener los exámenes: ${error.message}`,
      );
    }
  }

  /**
   * Recupera una lista paginada de todos los exámenes médicos de un laboratorio, con opciones de búsqueda inteligente
   * y control de campos incluidos. Los resultados se ordenan por fecha de solicitud descendente.
   *
   * @param labId ID del laboratorio donde se realizan los exámenes.
   * @param limit Número máximo de exámenes a retornar.
   * @param offset Número de exámenes a omitir (para paginación).
   * @param includeData Si es true, incluye campos adicionales (resultProperties, observation) y relaciones completas (medicTestCatalog, medicHistory con paciente).
   * @param searchTerm (Opcional) Término de búsqueda para filtrar exámenes.
   * @param searchFields (Opcional) Campos específicos sobre los que aplicar la búsqueda.
   * @returns Un objeto con el total de exámenes encontrados, offset, límite y lista de exámenes.
   * @throws NotFoundException Si ocurre un error al obtener los exámenes médicos.
   */
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
        include: includeData
          ? {
              medicTestCatalog: true,
              medicHistory: {
                // Esto se puede optimizar no enviando nada de este
                include: {
                  patient: true, // Esto se puede optimizar solo enviando unos cuantos datos del paciente
                },
              },
            }
          : undefined,
        orderBy: {
          requestedAt: 'desc',
        },
        enumFields: {
          state: State,
          priority: Priority,
        },
      };

      // Lógica principal: usar intelligentSearch
      // Esta función ahora buscará directamente en el modelo requestMedicTest
      // sin el filtro de medicHistoryId específico.
      const { results: data, total } = await intelligentSearch(
        requestMedicTestModel, // 1. El modelo a buscar (requestMedicTest directamente)
        searchOptions, // 2. El término de búsqueda
        searchTerm, // 3. Los campos donde buscar
        searchFields, // 4. Las opciones (skip, take, omit, orderBy, enumFields)
      );

      return {
        total,
        offset,
        limit,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener todos los exámenes médicos: ${error.message}`,
      );
      // Lanza la excepción original si ya es una de las nuestras
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Envuelve otros errores en un NotFoundException genérico
      throw new NotFoundException(
        `Error al obtener todos los exámenes médicos: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene un examen médico específico por su ID en un laboratorio determinado.
   *
   * @param labId ID del laboratorio donde se encuentra el examen médico.
   * @param requestMedicTestId ID del examen médico a recuperar.
   * @returns El examen médico solicitado.
   * @throws NotFoundException Si ocurre un error al obtener el examen médico o si este no existe.
   */
  async getRequestMedicTest(labId: number, requestMedicTestId: number) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

      const where = {
        ...(requestMedicTestId && { id: requestMedicTestId }),
      };

      return await labPrisma.requestMedicTest.findFirst({
        where,
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener los historiales de los pacientes: ${error.message}`,
      );
      throw new NotFoundException(`${error.message}`);
    }
  }

  /**
   * Genera la URL de acceso para el PDF de resultados de un examen médico específico.
   * El PDF se busca en el almacenamiento bajo la ruta: 'medic-tests/{labId}/{requestMedicTestId}.pdf'
   *
   * @param labId ID del laboratorio donde se almacenó el examen médico.
   * @param requestMedicTestId ID del examen médico cuyos resultados se quieren obtener.
   * @returns URL firmada o de acceso público al archivo PDF solicitado.
   * @throws NotFoundException Si ocurre un error al generar la URL o si el archivo no existe.
   */
  async getRequestMedicTestPdf(labId: number, requestMedicTestId: number) {
    try {
      const bucket = 'medic-tests';
      const fullPath = `${bucket}/${labId}/${requestMedicTestId}.pdf`;
      return this.storageService.getFileUrl(fullPath);
    } catch (error) {
      this.logger.error(`Error al obtener el PDF`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  /**
   * Actualiza un examen médico específico con nuevos resultados u observaciones,
   * registrando la acción en el sistema de auditoría con información del paciente asociado.
   *
   * @param labId ID del laboratorio donde se encuentra el examen médico.
   * @param requestMedicTestId ID del examen médico a actualizar.
   * @param dto Objeto con los campos a actualizar (propiedades de resultados y observaciones).
   * @param performedByUserUuid UUID del usuario que realiza la actualización.
   * @returns El examen médico actualizado.
   * @throws NotFoundException Si el examen médico no existe.
   * @throws ConflictException Si ocurre un error durante la actualización.
   */
  async updateRequestMedicTest(
    labId: number,
    requestMedicTestId: number,
    dto: UpdateRequestMedicTest,
    performedByUserUuid: string,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      // Obtener el request incluyendo el paciente relacionado
      const requestWithPatient = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            include: {
              patient: true, // Trae todos los datos del paciente
            },
          },
        },
      });

      if (!requestWithPatient) {
        throw new NotFoundException(
          `Examen médico con ID ${requestMedicTestId} no encontrado`,
        );
      }

      const patient = requestWithPatient.medicHistory.patient;
      // Actualización del request
      const updated = await labPrisma.requestMedicTest.update({
        where: { id: requestMedicTestId },
        data: {
          resultProperties: dto.resultProperties,
          observation: dto.observation,
        },
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

  /**
   * Cambia el estado de un examen médico, validando las transiciones permitidas entre estados.
   * Cuando el estado se cambia a 'COMPLETED', genera un informe PDF y envía los resultados al paciente por correo.
   * Registra la acción en el sistema de auditoría y actualiza información relevante (usuario responsable, fecha de completado).
   *
   * @param labId ID del laboratorio donde se encuentra el examen médico.
   * @param requestMedicTestId ID del examen médico cuyo estado se va a cambiar.
   * @param state Nuevo estado al que se desea cambiar.
   * @param performedByUserUuid UUID del usuario que realiza el cambio de estado.
   * @returns El examen médico actualizado.
   * @throws NotFoundException Si el examen médico o el usuario del laboratorio no existen.
   * @throws ForbiddenException Si la transición desde el estado actual al nuevo estado no está permitida.
   * @throws ConflictException Si ocurre un error durante la actualización.
   */
  async changeStateRequestMedicTest(
    labId: number,
    requestMedicTestId: number,
    state: State,
    performedByUserUuid: string,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });
      const labUser = await this.labUserService.getLabUserByUuid(
        labId,
        performedByUserUuid,
      );
      const lab = await this.labService.getLabById(labId); // TODO Refactorizar todo esto

      // Obtener el request incluyendo el paciente relacionado
      const requestWithPatient = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            include: {
              patient: true, // Trae todos los datos del paciente
            },
          },
        },
      });

      if (!requestWithPatient) {
        throw new NotFoundException(
          `Examen médico con ID ${requestMedicTestId} no encontrado`,
        );
      }

      if (!labUser) {
        throw new NotFoundException(`Usuario del laboratorio no encontrado`);
      }

      // Verificar si la transción es válida
      for (const [currentState, possibleTransitions] of Object.entries(
        STATE_TRANSITIONS,
      )) {
        if (currentState === requestWithPatient?.state) {
          if (!possibleTransitions.includes(state as State)) {
            throw new ForbiddenException(
              `No se puede cambiar el estado de ${currentState} a ${state}`,
            );
          }
        }
      }

      const patient = requestWithPatient.medicHistory.patient;
      // Actualización del request
      const updated = await labPrisma.requestMedicTest.update({
        where: { id: requestMedicTestId },
        data: {
          state,
          byLabUserId: labUser.id,
          completedAt: state === 'COMPLETED' ? new Date().toISOString() : null, // Solo se actualiza si el estado es "COMPLETED"
        },
      });

      // Auditoría
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'set_state',
        entity: 'requestMedicTest',
        recordEntityId: updated.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} cambió el estado de un examen médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: {
          before: requestWithPatient.state,
          after: updated.state,
        },
      });

      if (updated.state === 'COMPLETED') {
        //TODO Con esto
        const pdf = await this.pdfService.generateMedicReport(
          labId,
          updated.id,
        );
        if (pdf.downloadUrl) {
          this.mailService.sendMedicResults(
            lab,
            patient,
            requestWithPatient,
            pdf.downloadUrl,
          );
        } else {
          this.logger.error(`No hay enlace de descarga para el PDF`);
        }
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar examen médico: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  /**
   * Elimina un examen médico específico de un laboratorio, registrando la acción en el sistema de auditoría
   * con información detallada del paciente asociado y los datos completos del examen eliminado.
   *
   * @param labId ID del laboratorio donde se encuentra el examen médico.
   * @param requestMedicTestId ID del examen médico a eliminar.
   * @param performedByUserUuid UUID del usuario que realiza la eliminación.
   * @returns El examen médico eliminado.
   * @throws NotFoundException Si el examen médico no existe.
   * @throws ConflictException Si ocurre un error durante la eliminación.
   */
  async deleteRequestMedicTest(
    labId: number,
    requestMedicTestId: number,
    performedByUserUuid: string,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      // 1. Obtener el examen médico con los datos completos del paciente
      const requestWithPatient = await labPrisma.requestMedicTest.findUnique({
        where: { id: requestMedicTestId },
        include: {
          medicHistory: {
            include: {
              patient: true, // Incluye todos los datos del paciente
            },
          },
        },
      });

      if (!requestWithPatient) {
        throw new NotFoundException(
          `Examen con ID ${requestMedicTestId} no encontrado`,
        );
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
