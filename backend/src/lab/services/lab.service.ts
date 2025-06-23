// /src/lab/services/lab.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { SystemPrismaService } from 'src/prisma-manage/system-prisma/system-prisma.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { Lab } from '@prisma/client-system';

import { UserCache } from 'src/shared-cache/dto/user-cache.interface';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { normalizeDbName } from 'src/common/utils/normalize-db-name';

@Injectable()
export class LabService {
  private readonly logger = new Logger(LabService.name);
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
    private readonly sharedCacheService: SharedCacheService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  /**
   * Valida que los campos únicos del laboratorio (RIF y nombre) no existan en la base de datos.
   * @param dto Datos del laboratorio a validar.
   * @returns El nombre de la base de datos normalizado.
   * @throws ConflictException si ya existe un laboratorio con el mismo RIF o nombre de base de datos.
   */
  private async validateUniqueLab(dto: CreateLabDto): Promise<string> {
    const { rif, name } = dto;
    const dbName = normalizeDbName(name);

    const existing = await this.systemPrisma.lab.findFirst({
      where: {
        OR: [{ rif }, { dbName }],
      },
    });

    if (existing) {
      if (existing.rif === rif) {
        throw new ConflictException(
          `Ya existe un laboratorio con el RIF ${rif}.`,
        );
      }
      if (existing.dbName === dbName) {
        throw new ConflictException(
          `Ya existe una base de datos para el nombre ${name}.`,
        );
      }
    }

    return dbName;
  }

  /**
   * Obtiene los datos de un usuario desde la caché.
   * Si el usuario no está en caché, devuelve null.
   *
   * @param uuid UUID del usuario.
   * @returns UserCache | null
   */
  async getUserCached(uuid: string): Promise<UserCache | null> {
    return await this.sharedCacheService.getUser(uuid);
  }

  /**
   * Se consume para cachear datos de un usuario en un laboratorio para un usuario dado su UUID y el ID del laboratorio.
   * Verifica si el usuario tiene acceso al laboratorio y guarda el rol asociado en caché.
   *
   * Lanza una excepción si el ID del laboratorio no está definido o si el usuario no tiene acceso.
   *
   * @param uuid UUID del usuario.
   * @param labId ID del laboratorio.
   * @throws {BadRequestException} Si el ID del laboratorio no está definido.
   * @throws {ForbiddenException} Si el usuario no tiene acceso al laboratorio.
   */
  async cachSelectedLab(uuid: string, labId: number) {
    if (!labId) {
      throw new BadRequestException(
        'El id del laboratorio debe estar definido',
      );
    }
    const lab = await this.systemPrisma.lab.findUnique({
      where: {
        id: Number(labId),
        // Y también debe cumplir esta condición relacional
        users: {
          some: {
            // Busca si "alguno" de los usuarios relacionados
            uuid: uuid, // tiene este uuid.
          },
        },
      },
    });

    if (lab) {
      const labPrisma = await this.labPrismaFactory.createInstanceDB(
        lab.dbName,
      );
      const userLab = await labPrisma.labUser.findUnique({
        where: { systemUserUuid: uuid },
      });
      if (userLab) {
        const permissions = await labPrisma.role.findUnique({
          where: { id: userLab.id },
        });
        if (permissions) {
          await this.sharedCacheService.setUser(uuid, labId, permissions);
        }
      }
    } else {
      throw new ForbiddenException(
        'El usuario no tiene acceso al laboratorio indicado',
      );
    }
  }

  /**
   * Crea un laboratorio en la base de datos del sistema,
   * luego crea y migra la base de datos específica del laboratorio (tenant).
   *
   * @param dto Datos del laboratorio
   * @param userId Usuario opcional para asociar el lab
   * @returns El laboratorio creado (modelo completo)
   */
  async createLab(dto: CreateLabDto, userId?: number): Promise<Lab> {
    const dbName = await this.validateUniqueLab(dto);

    const lab = await this.systemPrisma.lab.create({
      data: {
        name: dto.name,
        rif: dto.rif,
        dbName: dbName,
        dir: dto.dir,
        phoneNums: dto.phoneNums,
        ...(userId && {
          users: {
            connect: [{ id: userId }],
          },
        }),
      },
    });

    // 🔧 Migración de DB específica del laboratorio
    await this.labDbManageService.createDatabase(dbName);
    await this.labDbManageService.migrateDatabase(dbName);

    return lab;
  }

  async getLabById(labId: number) { // Esta función se puede pasar a otro lado
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

  /**
   * Revierte la creación de un laboratorio eliminando el registro correspondiente y borrando la base de datos asociada.
   *
   * @param dbName Nombre de la base de datos a eliminar.
   * @param labId ID del laboratorio a eliminar.
   * @throws BadRequestException Si ocurre un error durante el proceso de reversión.
   * @returns Promesa que resuelve cuando la operación ha finalizado.
   */
  async rollbackLabCreation(dbName: string, labId: number) {
    try {
      return await this.systemPrisma.$transaction(async (tx) => {
        await tx.lab.delete({ where: { id: labId } });
        return await this.labDbManageService.dropDatabase(dbName);
      });
    } catch (error) {
      this.logger.error(
        `Failed to rollback lab creation for db: ${dbName}, labId: ${labId}`,
        error,
      );
      throw new BadRequestException('Failed to rollback lab creation');
    }
  }
}
