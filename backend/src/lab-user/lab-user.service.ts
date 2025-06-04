import { Injectable, Logger } from '@nestjs/common';
import { LabPrismaFactory } from '../lab-prisma/lab-prisma.factory';
import { CreateLabUserDto } from './dto/create-lab-user.dto';
import { RoleService } from '../role/role.service';

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
  ) {}

  /**
   * Crea un usuario de laboratorio en la base de datos especificada.
   * @param dbName Nombre de la base de datos de laboratorio.
   * @param input Datos del usuario de laboratorio a crear.
   * @throws Relanza cualquier error ocurrido durante la operación de siembra.
   */
  async createLabUser(dbName: string, input: CreateLabUserDto) {
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);
    try {
      this.logger.log(`🔗 Conectando a la base de datos ${dbName}...`);
      await prisma.$connect();

      const { systemUserUuid, role } = input;

      // 1. Rol
      const roleRecord = await this.roleService.CreateRoleIfNotExists(
        prisma,
        role,
      );

      // 2. Verificar existencia del usuario
      const existingLabUser = await prisma.labUser.findUnique({
        where: { systemUserUuid },
      });

      if (existingLabUser) return;

      // 3. Crear LabUser
      await prisma.labUser.create({
        data: {
          systemUserUuid,
          roleId: roleRecord.id,
        },
      });

      this.logger.log(`✅ LabUser creado con rol '${role.name}' en ${dbName}`);
    } catch (error) {
      this.logger.error(`❌ Error al insertar usuario en ${dbName}`, error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}
