// backend/src/user/user.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabMigrationService } from 'src/lab-prisma/services/lab-migration.service';
import { LabSeedingService } from 'src/lab-prisma/services/lab-seeding.service';
import { normalizeDbName } from 'src/common/utils/normalize-db-name';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labMigrationService: LabMigrationService,
    private readonly labSeedingService: LabSeedingService,
  ) {}

  async createSystemUserAndLab(dto: RegisterDto) {
    const { email, ci, password, name, lastName, lab } = dto;

    // 1. Verifica si el usuario ya existe por email o CI
    const existingUser = await this.systemPrisma.systemUser.findFirst({
      where: {
        OR: [{ email }, { ci }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email o CI.');
    }

    // 2. Normaliza el nombre de la base de datos y valida campos únicos (rif, dbName)
    const dbName = await this.validateUniqueLabFields(lab);

    // 3. Crea el laboratorio en la base central
    const labRecord = await this.systemPrisma.lab.create({
      data: {
        name: lab.name,
        rif: lab.rif,
        dbName,
        dir: lab.dir,
        phoneNums: lab.phoneNums,
        logoPath: lab.logoPath,
      },
    });

    // 4. Crea la base de datos y ejecuta la migración
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // 5. Hashea la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Crea el usuario del sistema y lo asocia al laboratorio
    const systemUser = await this.systemPrisma.systemUser.create({
      data: {
        ci,
        name,
        lastName,
        email,
        password: hashedPassword,
        salt,
        labs: {
          connect: [{ id: labRecord.id }],
        },
      },
    });

    // Inserta usuario en base de datos dinámica del laboratorio
    await this.labSeedingService.seedLabUser(dbName, {
      systemUserUuid: systemUser.uuid,
      role: {
        name: 'admin',
        description: 'Administrador del laboratorio',
        permissions: ['all'],
      },
    });

    this.logger.log(
      `🧪 Usuario registrado: ${systemUser.email} → Lab: ${labRecord.name}`,
    );

    return {
      uuid: systemUser.uuid,
      labs: [labRecord],
    };
  }

  async createLabForUser(userUuid: string, dto: CreateLabDto) {
    // validacion de campos unicos
    const dbName = await this.validateUniqueLabFields(dto);

    // 1. Verifica que el usuario existe
    const user = await this.systemPrisma.systemUser.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new ConflictException('Usuario no encontrado.');
    }

    // 2. Crea el laboratorio
    const lab = await this.systemPrisma.lab.create({
      data: {
        name: dto.name,
        rif: dto.rif,
        dbName,
        dir: dto.dir,
        phoneNums: dto.phoneNums,
        logoPath: dto.logoPath,
        users: {
          connect: [{ id: user.id }],
        },
      },
    });

    // 3. Crea la base de datos física y la migra
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // Inserta en la DB dinámica el usuario como admin del nuevo lab
    await this.labSeedingService.seedLabUser(dbName, {
      systemUserUuid: user.uuid,
      role: {
        name: 'admin',
        description: 'Administrador del laboratorio',
        permissions: ['all'],
      },
    });

    return {
      id: lab.id,
      name: lab.name,
      rif: lab.rif,
      status: lab.status,
      createdAt: lab.createdAt,
    };
  }

  /**
   * Busca un usuario del sistema por su email.
   * @param email El email del usuario a buscar.
   * @returns El usuario encontrado o null si no existe.
   */
  async findByEmail(email: string) {
    return this.systemPrisma.systemUser.findUnique({
      where: { email },
      include: {
        labs: true, // Incluye todos los laboratorios asociados a ese usuario
      },
    });
  }

  private async validateUniqueLabFields(dto: CreateLabDto) {
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

    return dbName; // lo normalizas aquí y lo reutilizas
  }
}
