import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { CreateAdminLabDto } from './dto/create-admin-lab.dto';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabMigrationService } from 'src/lab-prisma/services/lab-migration.service';
import * as bcrypt from 'bcrypt';
import { normalizeDbName } from 'src/common/utils/normalize-db-name';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labMigrationService: LabMigrationService,
  ) {}

  async createSystemUserAndLab(dto: CreateAdminLabDto) {
    const {
      email,
      ci,
      password,
      name,
      lastName,
      labName,
      labRif,
      labDir,
      labPhone,
    } = dto;

    // 1. Validar existencia de email o CI
    const existingUser = await this.systemPrisma.systemUser.findFirst({
      where: {
        OR: [{ email }, { ci }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email o CI.');
    }

    // 2. Formatear nombre de base de datos
    const dbName = normalizeDbName(labName);
    const dbExists = await this.labMigrationService.isDatabaseExists(dbName);
    if (dbExists) {
      throw new ConflictException(
        `Ya existe una base de datos con el nombre ${labName}.`,
      );
    }

    // 3. Crear entrada en tabla `Lab` (system DB)
    const lab = await this.systemPrisma.lab.create({
      data: {
        name: labName,
        rif: labRif,
        dbName: dbName,
        dir: labDir,
        phoneNums: labPhone,
      },
    });

    // 4. Crear base de datos y migrar
    await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    // 5. Hashear password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Crear SystemUser y asociarlo al Lab
    const systemUser = await this.systemPrisma.systemUser.create({
      data: {
        ci,
        name,
        lastName,
        email,
        password: hashedPassword,
        salt,
        labId: lab.id,
      },
    });

    this.logger.log(
      `🧪 Nuevo usuario admin registrado: ${systemUser.email} para laboratorio ${lab.dbName}`,
    );

    return {
      user: {
        uuid: systemUser.uuid,
        email: systemUser.email,
        name: systemUser.name,
      },
      lab: {
        name: lab.name,
        dbName: lab.dbName,
      },
    };
  }

  async findByEmail(email: string) {
    return this.systemPrisma.systemUser.findUnique({
      where: { email },
      include: {
        lab: true, // necesitamos esto para incluir el dbName
      },
    });
  }
}
