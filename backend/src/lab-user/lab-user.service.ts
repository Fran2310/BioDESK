import { Injectable, Logger } from '@nestjs/common';
import { LabPrismaFactory } from '../lab-prisma/lab-prisma.factory';
import { CreateLabUserDto } from './dto/create-lab-user.dto';
import { RoleService } from '../role/role.service';
import { SystemPrismaService } from '../system-prisma/system-prisma.service';
import { LabUser } from '@prisma/client-lab';

/**
 * Servicio para la gestión de usuarios de laboratorio.
 * Permite crear un usuario de laboratorio en una base de datos específica, asegurando que el rol exista
 * y evitando duplicados. Utiliza el patrón multi-tenant para la conexión dinámica a la base de datos.
 * Registra eventos relevantes y errores mediante el logger interno.
 *
 */
@Injectable()
export class LabUserService {
  private readonly logger = new Logger(LabUserService.name);

  constructor(
    private readonly roleService: RoleService,
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
  ) {}

  /**
   * Crea un usuario de laboratorio en la base de datos especificada.
   * @param labId ID del laboratorio (se usa para resolver dbName).
   * @param input Datos del usuario de laboratorio a crear.
   * @param performedByUserUuid UUID del usuario que realiza la operación (para auditoría).
   * @returns El registro creado de LabUser.
   */
  async createLabUser(
    labId: number,
    input: CreateLabUserDto,
    performedByUserUuid: string,
  ): Promise<LabUser | null> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    try {
      this.logger.log(`🔗 Conectando a la base de datos ${dbName}...`);
      await prisma.$connect();

      const { systemUserUuid, role } = input;

      // 1. Rol
      const roleRecord = await this.roleService.createRoleIfNotExists(
        prisma,
        role,
        labId,
        performedByUserUuid,
      );

      // 2. Verificar existencia del usuario
      const existingLabUser = await prisma.labUser.findUnique({
        where: { systemUserUuid },
      });

      if (existingLabUser) {
        this.logger.warn(
          `El usuario ya existe en la base del lab: ${systemUserUuid}`,
        );
        return null; // ya estaba creado
      }

      // 3. Crear LabUser
      const createdLabUser = await prisma.labUser.create({
        data: {
          systemUserUuid,
          roleId: roleRecord.id,
        },
      });

      this.logger.log(`✅ LabUser creado con rol '${role.name}' en ${dbName}`);
      return createdLabUser;
    } catch (error) {
      this.logger.error(`❌ Error al insertar usuario en ${dbName}`, error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}
