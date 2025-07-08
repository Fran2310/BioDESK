import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { AuditService } from 'src/audit/audit.service';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';

import { intelligentSearch } from 'src/common/utils/intelligentSearch';
import { Gender } from '@prisma/client-lab';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly systemUserService: SystemUserService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  /**
   * Valida la unicidad de un paciente en la base de datos del laboratorio.
   *
   * @param labId - ID del laboratorio donde se realiza la búsqueda.
   * @param ci - Cédula de identidad del paciente a validar.
   * @param email - Correo electrónico del paciente a validar.
   * @param idToExclude - ID del paciente a excluir de la búsqueda.
   * @throws ConflictException - Si ya existe un paciente con la misma cédula o correo electrónico.
   */
  private async validateUniquePatient(
    labId: number,
    ci?: string | undefined,
    email?: string | undefined,
    idToExclude?: number,
  ) {
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

    const patient = await labPrisma.patient.findFirst({
      where: {
        OR: [{ ci }, { email }],
        NOT: { id: idToExclude },
      },
    });

    if (patient) {
      if (patient.ci === ci) {
        throw new ConflictException(
          `Ya existe un paciente con esta cédula ${ci}.`,
        );
      }
      if (patient.email === email) {
        throw new ConflictException(
          `Ya existe un paciente con este correo ${email}`,
        );
      }
    }
  }

  /**
   * Recupera una lista paginada de pacientes para un laboratorio específico, permitiendo búsqueda inteligente y selección opcional de campos adicionales.
   *
   * @param labId ID del laboratorio.
   * @param limit Número máximo de pacientes a retornar.
   * @param offset Número de pacientes a omitir (para paginación).
   * @param includeData Si es true, incluye campos adicionales en la respuesta.
   * @param searchTerm (Opcional) Término de búsqueda para filtrar pacientes.
   * @param searchFields (Opcional) Campos sobre los que aplicar la búsqueda.
   * @returns Un objeto con el total de pacientes encontrados, el offset, el límite y la lista de pacientes.
   * @throws NotFoundException Si ocurre un error al obtener los pacientes.
   */
  async getAllPatients(
    labId: number,
    limit: number,
    offset: number,
    includeData: boolean,
    searchTerm?: string,
    searchFields?: string[],
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

      const selectFieldsToOmit = {
        secondName: !includeData,
        secondLastName: !includeData,
        phoneNums: !includeData,
        dir: !includeData,
      };

      // Opciones para intelligentSearch
      const searchOptions = {
        skip: offset,
        take: limit,
        omit: selectFieldsToOmit,
        include: {
          medicHistory: {
            select: { id: true },
          },
        },
        enumFields: {
          gender: Gender,
        },
      };

      // Usar intelligentSearch o la búsqueda normal según si hay searchTerm
      const { results: data, total } = await intelligentSearch(
        labPrisma.patient,
        searchOptions,
        searchTerm,
        searchFields,
      );

      return {
        total,
        offset,
        limit,
        data,
      };
    } catch (error) {
      this.logger.error(`Error al obtener pacientes: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  /**
   * Obtiene la información de un paciente a partir de al menos uno de los siguientes identificadores: patientId, email o ci, para un laboratorio específico.
   * Lanza una ConflictException si no se proporciona ningún identificador y una NotFoundException si el paciente no existe.
   *
   * @param labId - ID del laboratorio.
   * @param patientId - (Opcional) ID del paciente.
   * @param email - (Opcional) Correo electrónico del paciente.
   * @param ci - (Opcional) CI del paciente.
   * @returns Promesa que resuelve con la información del paciente y su historial médico.
   */
  async getPatient(
    labId: number,
    patientId?: number,
    email?: string,
    ci?: string,
  ): Promise<any> {
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

    if (!patientId && !email && !ci) {
      throw new ConflictException(
        'Debes proporcionar al menos uno: patientId, email, ci.',
      );
    }

    const where = {
      ...(patientId && { id: patientId }),
      ...(email && { email }),
      ...(ci && { ci }),
    };

    const patient = await labPrisma.patient.findFirst({
      where,
      include: {
        medicHistory: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Paciente con el id ${patientId} no encontrado`,
      );
    }
    return patient;
  }

  /**
   * Crea un nuevo paciente en la base de datos del laboratorio especificado, valida la unicidad de cédula y correo,
   * registra el historial médico inicial y audita la acción realizada por el usuario correspondiente.
   * Lanza una ConflictException si ocurre algún error durante el proceso.
   *
   * @param labId ID del laboratorio donde se creará el paciente.
   * @param dto Datos del paciente a crear.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El paciente creado.
   */
  async createPatient(
    labId: number,
    dto: CreatePatientDto,
    performedByUserUuid,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      await this.validateUniquePatient(labId, dto.ci, dto.email);

      const patient = await labPrisma.patient.create({
        data: dto,
      });

      await labPrisma.medicHistory.create({
        data: {
          patientId: patient.id,
        },
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} añadió al paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'Patient',
        recordEntityId: patient.id.toString(),
        operationData: {
          after: {
            patient,
          },
        },
      });

      return patient;
    } catch (error) {
      this.logger.error(`Error al crear paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  /**
   * Actualiza la información de un paciente en la base de datos del laboratorio especificado.
   *
   * @param labId ID del laboratorio donde se encuentra el paciente.
   * @param patientId ID del paciente a actualizar.
   * @param dto Datos actualizados del paciente.
   * @param performedByUserUuid UUID del usuario que realiza la actualización.
   * @returns El paciente actualizado.
   * @throws NotFoundException si el paciente no existe.
   * @throws ConflictException si ocurre un conflicto durante la actualización.
   */
  async updatePatient(
    labId: number,
    patientId: number,
    dto: UpdatePatientDto,
    performedByUserUuid: string,
  ) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      const before = await this.getPatient(labId, patientId); // Verifica si existe

      await this.validateUniquePatient(labId, dto.ci, dto.email, patientId);

      const updated = await labPrisma.patient.update({
        where: { id: Number(patientId) },
        data: dto,
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        entity: 'Patient',
        recordEntityId: updated.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} actualizó al paciente ${updated.name} ${updated.lastName} C.I: ${updated.ci} `,
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
   * Elimina un paciente y su historial médico asociado de la base de datos del laboratorio.
   * Registra la acción en el sistema de auditoría, incluyendo los datos previos a la eliminación.
   *
   * @param labId ID del laboratorio.
   * @param patientId ID del paciente a eliminar.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El paciente eliminado.
   * @throws NotFoundException Si el paciente no existe.
   * @throws ConflictException Si ocurre un error durante la eliminación.
   */
  async deletePatient(labId: number, patientId: number, performedByUserUuid) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({
        uuid: performedByUserUuid,
      });

      // Primero obtenemos los datos para auditoría
      const patientWithRelations = await labPrisma.patient.findUnique({
        where: { id: Number(patientId) },
        include: {
          medicHistory: {
            include: {
              requestMedicTests: true,
            },
          },
        },
      });

      if (!patientWithRelations) {
        throw new NotFoundException(
          `Paciente con ID ${patientId} no encontrado`,
        );
      }

      // Eliminar el historial médico primero (activará la cascada)
      if (patientWithRelations.medicHistory) {
        await labPrisma.medicHistory.delete({
          where: { id: patientWithRelations.medicHistory.id },
        });
      }

      const deletedPatient = await labPrisma.patient.delete({
        where: { id: Number(patientId) },
      });

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'delete',
        entity: 'Patient',
        recordEntityId: deletedPatient.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} eliminó al paciente ${deletedPatient.name} ${deletedPatient.lastName} C.I: ${deletedPatient.ci}`,
        operationData: {
          before: patientWithRelations, // Se guardan toda la información borrada en cascade
        },
      });

      return deletedPatient;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar paciente: ${error.message}`);
      throw new ConflictException('Error al eliminar paciente');
    }
  }
}
