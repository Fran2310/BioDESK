import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';
import { LabPrismaService } from 'src/prisma-manager/lab-prisma/services/lab-prisma.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { CreateMedicHistoryDto } from './dto/create-medic-history.dto';
import { PatientService } from '../patient/patient.service';
import { UpdateMedicHistory } from './dto/update-medic-history.dto';

/**
 * Servicio para gestionar el historial médico de los pacientes.
 * Proporciona métodos para verificar, obtener, crear, actualizar y eliminar
 * historiales médicos en bases de datos específicas de laboratorio.
 * Utiliza servicios auxiliares para la gestión de usuarios, pacientes,
 * auditoría y bases de datos.
 */
@Injectable()
export class MedicHistoryService {
  private readonly logger = new Logger(MedicHistoryService.name);

  constructor(
    private readonly systemUserService: SystemUserService,
    private readonly patientService: PatientService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
  ) {}
  /**
   * Verifica que el paciente no tenga un historial médico existente en la base de datos.
   * Lanza una ConflictException si ya existe un historial para el paciente.
   * Si ocurre otro error, registra el error y lanza una InternalServerErrorException.
   *
   * @param labPrisma Instancia de LabPrismaService para acceder a la base de datos.
   * @param patientId ID del paciente a verificar.
   * @throws ConflictException Si el paciente ya tiene historial médico.
   * @throws InternalServerErrorException Si ocurre un error inesperado durante la verificación.
   */
  private async verifyPatientHasNoMedicalHistory(
    labPrisma: LabPrismaService,
    patientId: number,
  ): Promise<void> {
    // Cambiamos el retorno a void ya que lanzará excepción si existe
    try {
      const existingHistory = await labPrisma.medicHistory.findFirst({
        where: { patientId },
        select: { id: true },
      });

      if (existingHistory) {
        throw new ConflictException(
          'El paciente ya tiene asignado un historial médico',
        );
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Preservar el error original de conflicto
      }

      this.logger.error(
        `Error al verificar historial médico: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al verificar historial médico existente',
      );
    }
  }

  /**
   * Obtiene el historial médico de un paciente o por ID de historial médico para un laboratorio específico.
   *
   * @param labId ID del laboratorio.
   * @param includeData Si es true, incluye datos adicionales de pruebas médicas.
   * @param patientId (Opcional) ID del paciente.
   * @param medicHistoryId (Opcional) ID del historial médico.
   * @returns El historial médico encontrado o lanza una excepción si no se encuentra.
   * @throws ConflictException Si no se proporciona patientId ni medicHistoryId.
   * @throws NotFoundException Si ocurre un error al obtener el historial.
   */
  async getMedicHistory(
    labId: number,
    includeData: boolean,
    patientId?: number,
    medicHistoryId?: number,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

      if (!patientId && !medicHistoryId) {
        throw new ConflictException(
          'Debes proporcionar al menos uno: patientId, medicHistoryId.',
        );
      }

      const selectFieldsToOmitInMedicTests = {
        resultProperties: true,
        observation: true,
        medicHistoryId: true,
      };

      const where = {
        ...(medicHistoryId && { id: medicHistoryId }),
        ...(patientId && { patientId }),
      };

      return await labPrisma.medicHistory.findFirst({
        where,
        include: {
          requestMedicTests: includeData
            ? {
                omit: selectFieldsToOmitInMedicTests,
              }
            : false,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener los historiales de los pacientes: ${error.message}`,
      );
      throw new NotFoundException(`${error.message}`);
    }
  }

  /**
   * Crea un nuevo historial médico para un paciente en el laboratorio especificado.
   * Verifica que el paciente no tenga un historial previo, registra la acción en auditoría
   * y maneja posibles conflictos o errores durante el proceso.
   *
   * @param labId ID del laboratorio.
   * @param dto Datos para crear el historial médico.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El historial médico creado.
   * @throws ConflictException Si ocurre un error al crear el historial.
   */
  async createMedicHistory(
    labId: number,
    dto: CreateMedicHistoryDto,
    performedByUserUuid,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

      await this.verifyPatientHasNoMedicalHistory(labPrisma, dto.patientId);

      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });
      const patient = await this.patientService.getPatient(
        labId,
        dto.patientId,
      );

      const history = await labPrisma.medicHistory.create({
        data: dto,
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} creó el historial médico para el paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'medicHistory',
        recordEntityId: history.id.toString(),
        operationData: {
          after: {
            history,
          },
        },
      });

      return history;
    } catch (error) {
      this.logger.error(
        `Error al crear el historial del paciente: ${error.message}`,
      );
      throw new ConflictException(`${error.message}`);
    }
  }

  /**
   * Actualiza el historial médico de un paciente en una base de datos de laboratorio específica.
   *
   * @param labId ID del laboratorio.
   * @param dto Datos para actualizar el historial médico.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @param patientId ID del paciente cuyo historial se actualizará.
   * @returns El historial médico actualizado.
   * @throws NotFoundException Si no se encuentra el historial médico del paciente.
   * @throws ConflictException Si ocurre un error durante la actualización.
   */
  async updateMedicHistory(
    labId: number,
    dto: UpdateMedicHistory,
    performedByUserUuid,
    patientId: number,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      // Verificar existencia del historial
      const before = await this.getMedicHistory(labId, false, patientId);
      if (!before) {
        throw new NotFoundException(
          `Historial médico no encontrado para el paciente ${patientId}`,
        );
      }

      const patient = await this.patientService.getPatient(
        labId,
        before.patientId,
      );

      const updated = await labPrisma.medicHistory.update({
        where: { patientId: Number(patient.id) },
        data: {
          allergies: dto.allergies,
          pathologies: dto.pathologies,
        },
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        entity: 'medicHistory',
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

  /**
   * Elimina el historial médico de un paciente en un laboratorio específico.
   *
   * @param labId ID del laboratorio.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @param patientId ID del paciente cuyo historial se eliminará.
   * @returns El historial médico eliminado.
   * @throws NotFoundException si no se encuentra el historial médico.
   * @throws ConflictException si ocurre un error durante la eliminación.
   */
  async deleteMedicHistory(
    labId: number,
    performedByUserUuid,
    patientId: number,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      const before = await this.getMedicHistory(labId, false, patientId);
      if (!before) {
        throw new NotFoundException(
          `Historial médico no encontrado para el paciente ${patientId}`,
        );
      }

      const deletedMedicHistory = await labPrisma.medicHistory.delete({
        where: { id: before.id },
      });

      const patient = await this.patientService.getPatient(
        labId,
        before.patientId,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'delete',
        entity: 'Patient',
        recordEntityId: deletedMedicHistory.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} eliminó el historial médico del paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci}`,
        operationData: {
          before: deletedMedicHistory,
        },
      });

      return deletedMedicHistory;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error al eliminar el historial médico del paciente: ${error.message}`,
      );
      throw new ConflictException('Error al eliminar paciente');
    }
  }
}
