// backend/src/user/user.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabMigrationService } from 'src/lab-prisma/services/lab-migration.service';
import { LabSeedingService } from 'src/lab-prisma/services/lab-seeding.service';
import { normalizeDbName } from 'src/common/utils/normalize-db-name';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { RoleDto } from 'src/lab-prisma/dto/create-lab-user.dto';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labMigrationService: LabMigrationService,
    private readonly labSeedingService: LabSeedingService,
  ) {}

  private async getDbNameByLabId(labId: number): Promise<string> {
    /**
     * Obtiene el nombre de la base de datos asociada a un laboratorio por su ID.
     * @param labId ID del laboratorio.
     * @returns Nombre de la base de datos del laboratorio.
     * @throws ConflictException si el laboratorio no existe.
     */
    const lab = await this.systemPrisma.lab.findUnique({
      where: { id: labId },
      select: { dbName: true },
    });

    if (!lab) {
      throw new ConflictException(`Laboratorio con id=${labId} no encontrado.`);
    }

    return lab.dbName;
  }

  private async createLabRecord(dto: CreateLabDto, userId?: number) {
    /**
     * Crea un laboratorio y valida campos únicos (RIF y nombre de base de datos).
     * @param dto Datos del laboratorio a crear.
     * @param userId ID del usuario que será asociado al laboratorio (opcional).
     * @returns Información del laboratorio creado y el nombre de la base de datos.
     */
    const dbName = await this.validateUniqueLabFields(dto);
    const labRecord = await this.systemPrisma.lab.create({
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

    return { labRecord, dbName };
  }

  // DEPRECATED
  private async seedLabAdminUser(dbName: string, userUuid: string) {
    /**
     * Inserta un usuario administrador en la base de datos dinámica del laboratorio.
     * @param dbName Nombre de la base de datos del laboratorio.
     * @param userUuid UUID del usuario del sistema que será administrador.
     * @returns Promesa que resuelve cuando se completa la inserción.
     */
    return this.labSeedingService.seedLabUser(dbName, {
      systemUserUuid: userUuid,
      role: {
        name: 'admin',
        description: 'Administrador del laboratorio',
        permissions: ['all'],
      },
    });
  }

  async createUserAndAssignToLab(
    labId: number,
    systemUserDto: CreateUserDto,
    role: RoleDto,
  ) {
    const { ci, name, lastName, email, password } = systemUserDto;

    // 1. Validar duplicado en DB del sistema
    const existingUser = await this.systemPrisma.systemUser.findFirst({
      where: {
        OR: [{ email }, { ci }],
      },
    });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email o CI.');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear usuario en la DB del sistema
    const systemUser = await this.systemPrisma.systemUser.create({
      data: {
        ci,
        name,
        lastName,
        email,
        password: hashedPassword,
        salt,
        labs: {
          connect: [{ id: labId }],
        },
      },
    });

    // 4. Obtener dbName dinámicamente
    const dbName = await this.getDbNameByLabId(labId);

    // 4. Insertar en la base de datos del laboratorio
    await this.labSeedingService.seedLabUser(dbName, {
      systemUserUuid: systemUser.uuid,
      role,
    });

    return {
      uuid: systemUser.uuid,
      email: systemUser.email,
    };
  }

  // DEPRECATED
  async createSystemUserAndLab(dto: RegisterDto) {
    /**
     * Crea un usuario del sistema y un laboratorio asociado.
     * @param dto Datos del usuario y laboratorio a crear.
     * @returns Información del usuario creado y el laboratorio asociado.
     */
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

    // 2. Normaliza el nombre de la base de datos y valida campos únicos (rif, dbName) y Crea el laboratorio en la base central
    const { labRecord, dbName } = await this.createLabRecord(lab);

    // 3. Crea la base de datos y ejecuta la migración
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // 4. Hashea la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Crea el usuario del sistema y lo asocia al laboratorio
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

    // 6.Inserta usuario admin en base de datos dinámica del laboratorio
    await this.seedLabAdminUser(dbName, systemUser.uuid);

    this.logger.log(
      `🧪 Usuario registrado: ${systemUser.email} → Lab: ${labRecord.name}`,
    );

    return {
      uuid: systemUser.uuid,
      labs: [labRecord],
    };
  }

  async createUserAdminAndLab(dto: RegisterDto) {
    /**
     * Crea un nuevo laboratorio y un usuario del sistema asociado a él como administrador.
     * Retorna uuid del usuario y el lab registrado.
     */
    const { lab, ...userDto } = dto;

    // 1. Crea el laboratorio (validando RIF y nombre únicos)
    const { labRecord, dbName } = await this.createLabRecord(lab);

    // 2. Crea la base de datos dinámica y aplica migraciones
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // 3. Crea el usuario y lo asocia al laboratorio con rol admin
    const { uuid, email } = await this.createUserAndAssignToLab(
      labRecord.id,
      userDto,
      {
        name: 'admin',
        description: 'Administrador del laboratorio',
        permissions: ['all'],
      },
    );

    this.logger.log(`🧪 Usuario registrado: ${email} → Lab: ${labRecord.name}`);

    return {
      uuid,
      labs: [labRecord],
    };
  }

  async createLabForUser(userUuid: string, dto: CreateLabDto) {
    /**
     * Crea un laboratorio para un usuario específico.
     * @param userUuid UUID del usuario al que se le asociará el laboratorio.
     * @param dto Datos del laboratorio a crear.
     * @returns Información del laboratorio creado.
     */
    // 1. Verifica que el usuario existe
    const user = await this.systemPrisma.systemUser.findUnique({
      where: { uuid: userUuid },
    });
    if (!user) {
      throw new ConflictException('Usuario no encontrado.');
    }

    // 2. Crea el laboratorio
    const { labRecord, dbName } = await this.createLabRecord(dto, user.id);

    // 3. Crea la base de datos física y la migra
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // Inserta en la DB dinámica el usuario como admin del nuevo lab
    await this.seedLabAdminUser(dbName, user.uuid);

    return {
      id: labRecord.id,
      name: labRecord.name,
      rif: labRecord.rif,
      status: labRecord.status,
      createdAt: labRecord.createdAt,
    };
  }

  async findByEmail(email: string) {
    /**
     * Busca un usuario del sistema por su email.
     * @param email El email del usuario a buscar.
     * @returns El usuario encontrado o null si no existe.
     */
    return this.systemPrisma.systemUser.findUnique({
      where: { email },
      include: {
        labs: true, // Incluye todos los laboratorios asociados a ese usuario
      },
    });
  }

  private async validateUniqueLabFields(dto: CreateLabDto) {
    /**
     * Valida que los campos únicos del laboratorio (RIF y nombre) no existan en la base de datos.
     * @param dto Datos del laboratorio a validar.
     * @returns El nombre de la base de datos normalizado.
     * @throws ConflictException si ya existe un laboratorio con el mismo RIF o nombre de base de datos.
     */
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
