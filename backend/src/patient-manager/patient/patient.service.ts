import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { AuditService } from 'src/audit/audit.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';

import { intelligentSearch } from 'src/common/services/intelligentSearch.service';
import { Gender } from '@prisma/client-lab';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly systemUserService: SystemUserService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  // ============ CRUD OPERATIONS ============

  async createPatient(labId: number, dto: CreatePatientDto, performedByUserUuid) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})

      await this.validateUniquePatient(labId, dto.ci, dto.email)

      const patient = await labPrisma.patient.create({
        data: dto,
      });

      await labPrisma.medicHistory.create({
        data: {
          patientId: patient.id,
        },
      })

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `El usuario ${systemUser.name} ${systemUser.lastName} añadió al paciente ${patient.name} ${patient.lastName} C.I: ${patient.ci} `,
        entity: 'Patient',
        recordEntityId: patient.id.toString(),
        operationData: {
          after: {
            patient
          },
        },
      });

      return patient;

    } catch (error) {
      this.logger.error(`Error al crear paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async getAllPatients(
    labId: number,
    limit: number,
    offset: number,
    includeData: boolean,
    searchTerm?: string,
    searchFields?: string[]
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
            select: { id: true }
          }
        },
        enumFields: {
          gender: Gender,
        }
      };
  
      // Usar intelligentSearch o la búsqueda normal según si hay searchTerm
      const { results: data, total } = await intelligentSearch(
            labPrisma.patient,
            searchTerm,
            searchFields,
            searchOptions
      )

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

  async getPatient(labId: number,  patientId?: number, email?: string, ci?: string): Promise<any> {
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

    if (!patientId && !email && !ci ) {
      throw new ConflictException(
        'Debes proporcionar al menos uno: patientId, email, ci.',
      );
    }

    const where = {
      ...(patientId && {id: patientId }),
      ...(email && { email }),
      ...(ci && { ci }),
    };

    const patient = await labPrisma.patient.findFirst({
      where,
      include: {
        medicHistory: {
          select: {
            id: true
          }
        }
      }
    });

    if (!patient) {
      throw new NotFoundException(`Paciente con el id ${patientId} no encontrado`);
    }
    return patient;
  }

  async updatePatient(labId: number, patientId: number, dto: UpdatePatientDto, performedByUserUuid: string) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})

      const before = await this.getPatient(labId, patientId); // Verifica si existe

      if (before.ci != dto.ci || before.email != dto.email) {
        await this.validateUniquePatient(labId, dto.ci, dto.email)
      }

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

  async deletePatient(labId: number, patientId: number, performedByUserUuid) {
    try {
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})
      
      // Primero obtenemos los datos para auditoría
      const patientWithRelations = await labPrisma.patient.findUnique({
        where: { id: Number(patientId) },
        include: {
          medicHistory: {
            include: {
              requestMedicTests: true
            }
          }
        }
      });

      if (!patientWithRelations) {
        throw new NotFoundException(`Paciente con ID ${patientId} no encontrado`);
      }

        // Eliminar el historial médico primero (activará la cascada)
      if (patientWithRelations.medicHistory) {
        await labPrisma.medicHistory.delete({
          where: { id: patientWithRelations.medicHistory.id }
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

  // ============ HELPER METHODS ============

  private async validateUniquePatient(labId: number, ci?: string | undefined, email?: string | undefined) {
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);

    const patient = await labPrisma.patient.findFirst({
      where: {
        OR: [{ ci }, { email }],
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
}