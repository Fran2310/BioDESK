import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { AuditService } from 'src/audit/audit.service';
import { LabService } from 'src/lab/services/lab.service';
import { MedicHistoryService } from '../medic-history/medic-history.service';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemUserService: SystemUserService,
    private readonly labService: LabService,
    private readonly medicHistoryService: MedicHistoryService,
    private readonly auditService: AuditService,
  ) {}

  // ============ CRUD OPERATIONS ============

  async createPatient(labId: number, dto: CreatePatientDto, performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
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

      this.logger.log(
        `Paciente creado para el laboratorio ${lab.name} (${lab.rif})`,
      );

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

  async getAllPatients(labId: number, limit: number, offset: number, all_data: boolean) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      const selectFieldsToOmit = {
        secondName: !all_data,
        secondLastName: !all_data,
        phoneNums: !all_data,
        dir: !all_data, 
      }

      return await labPrisma.patient.findMany({
        skip: offset,
        take: limit,
        omit: selectFieldsToOmit, //TODO colocar include despues para el patient-history
      })

    } catch (error) {
      this.logger.error(`Error al obtener pacientes: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async getPatient(labId: number,  patientId?: number, email?: string, ci?: string): Promise<any> {
    const lab = await this.labService.getLabById(labId);
    const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

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
    });

    if (!patient) {
      throw new NotFoundException(`Paciente con el id ${patientId} no encontrado`);
    }
    return patient;
  }

  async updatePatient(labId: number, patientId: number, dto: UpdatePatientDto, performedByUserUuid) {
    try {
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})

      const before = await this.getPatient(labId, patientId); // Verifica si existe

      if (dto.ci) {
        if (dto.email) {
          await this.validateUniquePatient(labId, dto.ci, dto.email)
        }
      }

      const updated = await labPrisma.patient.update({
        where: { id: Number(patientId) },
        data: dto,
      });
      
      this.logger.log(
        `Paciente actualizado para el laboratorio ${lab.name} (${lab.rif})`,
      );

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
      const lab = await this.labService.getLabById(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      const systemUser = await this.systemUserService.getSystemUser({uuid: performedByUserUuid})

      const deletedPatient = await labPrisma.patient.delete({
        where: { id: Number(patientId) },
      });

      this.logger.log(
        `Paciente borrado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'delete',
        entity: 'Patient',
        recordEntityId: deletedPatient.id.toString(),
        details: `El usuario ${systemUser.name} ${systemUser.lastName} eliminó al paciente ${deletedPatient.name} ${deletedPatient.lastName} C.I: ${deletedPatient.ci}`,
        operationData: {
          before: deletedPatient,
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

  private async validateUniquePatient(labId: number, ci: string | undefined, email: string | undefined) {
    const lab = await this.labService.getLabById(labId);
    const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

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