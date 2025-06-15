import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { LabPrismaFactory } from 'src/lab-prisma/lab-prisma.factory';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabPrismaService } from 'src/lab-prisma/services/lab-prisma.service';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labPrismaFactory: LabPrismaFactory,
  ) {}

  // ============ CRUD OPERATIONS ============

  async create(labId: number, dto: CreatePatientDto) {
    try {
      const lab = await this.validateLab(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      await this.validateUniquePatient(labId, dto.ci, dto.email)

      const patient = await labPrisma.patient.create({
        data: dto,
      });

      this.logger.log(
        `Paciente creado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      return patient;

    } catch (error) {
      this.logger.error(`Error al crear paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async findAll(labId: number) {
    try {
      const lab = await this.validateLab(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);
      
      return await labPrisma.patient.findMany();
    } catch (error) {
      this.logger.error(`Error al obtener pacientes: ${error.message}`);
      throw new NotFoundException(`${error.message}`);
    }
  }

  async findOne(labId: number, patientId: number) {
    try {
      const lab = await this.validateLab(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      const patient = await labPrisma.patient.findUnique({
        where: { id: Number(patientId) },
      });

      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }
      return patient;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al buscar paciente: ${error.message}`);
      throw new BadRequestException(`${error.message}`);
    }
  }

  async update(labId: number, patientId: number, dto: UpdatePatientDto) {
    try {
      const lab = await this.validateLab(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      await this.findOne(labId, patientId); // Verifica si existe

      if (dto.ci) {
        if (dto.email) {
          await this.validateUniquePatient(labId, dto.ci, dto.email)
        }
      }

      const patient = await labPrisma.patient.update({
        where: { id: Number(patientId) },
        data: dto,
      });
      
      this.logger.log(
        `Paciente actualizado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      return patient
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar paciente: ${error.message}`);
      throw new ConflictException(`${error.message}`);
    }
  }

  async remove(labId: number, patientId: number) {
    try {
      const lab = await this.validateLab(labId);
      const labPrisma = await this.labPrismaFactory.createInstanceDB(lab.dbName);

      await this.findOne(labId, patientId); // Verifica si existe

      this.logger.log(
        `Paciente borrado para el laboratorio ${lab.name} (${lab.rif})`,
      );

      return await labPrisma.patient.delete({
        where: { id: Number(patientId) },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar paciente: ${error.message}`);
      throw new ConflictException('Error al eliminar paciente');
    }
  }

  // ============ HELPER METHODS ============

  private async validateLab(labId: number) {
    try {
      const lab = await this.systemPrisma.lab.findUnique({
        where: { id: Number(labId) },
      });

      if (!lab) {
        throw new NotFoundException(`Lab with ID ${labId} not found`);
      }
      return lab;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al validar laboratorio: ${error.message}`);
      throw new InternalServerErrorException('Error al validar laboratorio');
    }
  }

  private async validateUniquePatient(labId: number, ci: string, email: string) {
      const lab = await this.validateLab(labId);
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