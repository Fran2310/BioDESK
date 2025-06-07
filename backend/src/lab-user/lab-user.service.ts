import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LabPrismaFactory } from '../lab-prisma/lab-prisma.factory';
import { CreateLabUserDto } from './dto/create-lab-user.dto';
import { RoleService } from '../role/role.service';
import { SystemPrismaService } from '../system-prisma/system-prisma.service';
import { LabUser } from '@prisma/client-lab';
import { AuditService } from 'src/audit/audit.service';
import { PaginatedLabUserListDto } from './dto/lab-user-with-role.dto';
import { UserService } from 'src/user/user.service';
import { AssignExistingUserDto } from './dto/assign-existing-user.dto';
import { SystemUser } from '@prisma/client-system';

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
    private readonly auditService: AuditService,
  ) {}

  /**
   * Valida que un rol con el ID proporcionado exista en el laboratorio especificado.
   *
   * @param labId ID del laboratorio.
   * @param roleId ID del rol a validar.
   * @throws NotFoundException Si el rol no existe en el laboratorio.
   */
  async validateRoleExists(labId: number, roleId: number) {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    const role = await this.roleService.getRoleById(prisma, roleId);
    if (!role) {
      throw new NotFoundException(
        `Rol con ID ${roleId} no encontrado en el laboratorio`,
      );
    } else {
      return role;
    }
  }

  /**
   * [METODO DUPLICADO DE UserService] - Problema con dependencias no se puede importar userService aqui
   * Obtiene un usuario del sistema por UUID, email o cédula.
   * @param params Objeto con uuid, email o ci del usuario a buscar.
   * @param includeLabs Indica si se deben incluir los laboratorios asociados al usuario.
   * @returns El usuario encontrado.
   * @throws ConflictException si no se proporciona ningún parámetro o si el usuario no existe.
   */
  async getSystemUser(params: {
    uuid?: string;
    email?: string;
    ci?: string;
    includeLabs?: boolean;
  }): Promise<SystemUser> {
    const { uuid, email, ci, includeLabs = false } = params;

    if (!uuid && !email && !ci) {
      throw new ConflictException(
        'Debes proporcionar al menos uno: uuid, email o ci.',
      );
    }

    const where = {
      ...(uuid && { uuid }),
      ...(email && { email }),
      ...(ci && { ci }),
    };

    const user = await this.systemPrisma.systemUser.findFirst({
      where,
      include: includeLabs ? { labs: true } : undefined,
    });

    if (!user) {
      throw new ConflictException('Usuario no encontrado.');
    }

    return user;
  }

  /**
   * Recupera una lista paginada de usuarios de laboratorio para un laboratorio específico,
   * incluyendo información de roles y, opcionalmente, permisos asociados.
   *
   * @param labId ID del laboratorio.
   * @param includePermissions Si es true, incluye los permisos del rol de cada usuario.
   * @param offset Número de registros a omitir para la paginación, por defecto 0.
   * @param limit Cantidad máxima de usuarios a retornar, por defecto 20.
   * @returns Una promesa que devuelve la lista paginada de usuarios de laboratorio y metadatos de paginación.
   */
  async getLabUsers(
    labId: number,
    includePermissions = false,
    offset = 0,
    limit = 20,
  ): Promise<PaginatedLabUserListDto> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    const [labUsers, totalUsers] = await Promise.all([
      prisma.labUser.findMany({
        skip: offset,
        take: limit,
        include: {
          role: {
            select: {
              id: true,
              role: true,
              description: true,
              ...(includePermissions ? { permissions: true } : {}),
            },
          },
        },
      }),
      prisma.labUser.count(),
    ]);

    const data = labUsers.map((labUser) => ({
      systemUserUuid: labUser.systemUserUuid,
      ...(labUser.role && {
        role: {
          id: labUser.role.id,
          name: labUser.role.role,
          description: labUser.role.description,
          ...(includePermissions && {
            permissions: labUser.role.permissions,
          }),
        },
      }),
    }));

    return {
      data,
      totalUsers,
      offset,
      limit,
    };
  }

  /**
   * Asocia un usuario del sistema a un laboratorio en la base de datos central (SystemPrisma).
   * No lanza error si ya están relacionados.
   *
   * @param userUuid UUID del usuario.
   * @param labId ID del laboratorio.
   */
  async linkSystemUserToLab(userUuid: string, labId: number): Promise<void> {
    // Verificar si ya existe la relación
    const alreadyLinked = await this.systemPrisma.systemUser.findFirst({
      where: {
        uuid: userUuid,
        labs: {
          some: { id: labId },
        },
      },
    });

    if (alreadyLinked) return;

    // Asociar al laboratorio (DB central)
    await this.systemPrisma.systemUser.update({
      where: { uuid: userUuid },
      data: {
        labs: {
          connect: { id: labId },
        },
      },
    });
  }

  /**
   * Asigna un usuario existente a un laboratorio con un rol específico.
   *
   * Busca al usuario por UUID, email o cédula, valida que el rol exista en el laboratorio,
   * y crea la relación correspondiente en LabUser. Retorna los datos del usuario y su rol asignado.
   *
   * @param labId ID del laboratorio.
   * @param dto Datos del usuario y rol a asignar.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns Información del usuario asignado y su rol.
   */
  async assignExistingUserToLab(
    labId: number,
    dto: AssignExistingUserDto,
    performedByUserUuid: string,
  ) {
    // 1. Buscar usuario
    const user = await this.getSystemUser({
      uuid: dto.uuid,
      email: dto.email,
      ci: dto.ci,
    });

    // 2. Validar que el rol exista en el laboratorio
    const role = await this.validateRoleExists(labId, dto.roleId);

    // 3. Insertar en LabUser
    const labUser = await this.createLabUser(
      labId,
      user.uuid,
      performedByUserUuid,
      dto.roleId,
    );

    // 2. Asociarlo a la DB central (si no lo está)
    await this.linkSystemUserToLab(user.uuid, labId);

    return {
      uuid: user.uuid,
      email: user.email,
      ci: user.ci,
      role: {
        id: role.id,
        name: role.role,
      },
    };
  }

  /**
   * Crea un nuevo usuario de laboratorio en la base de datos correspondiente.
   *
   * Verifica si el usuario ya está asignado al laboratorio y lanza una ConflictException si es así.
   * Asigna opcionalmente un rol al usuario. Registra la acción en el servicio de auditoría.
   *
   * @param labId ID del laboratorio.
   * @param systemUserUuid UUID del usuario del sistema.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @param roleId (opcional) ID del rol a asignar.
   * @returns El usuario de laboratorio creado o null.
   * @throws ConflictException si el usuario ya está asignado al laboratorio.
   */

  async createLabUser(
    labId: number,
    systemUserUuid: string,
    performedByUserUuid: string,
    roleId?: number,
  ): Promise<LabUser> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    await prisma.$connect();
    try {
      const existingLabUser = await prisma.labUser.findUnique({
        where: { systemUserUuid },
      });

      if (existingLabUser) {
        this.logger.warn(`El usuario ya existe en el lab: ${systemUserUuid}`);
        throw new ConflictException(
          `El usuario ya está asignado al laboratorio con UUID ${systemUserUuid}`,
        );
      }

      const created = await prisma.labUser.create({
        data: {
          systemUserUuid,
          ...(roleId && { roleId }),
        },
      });

      this.logger.log(
        `✅ LabUser creado para ${systemUserUuid} con rol ID ${roleId ?? 'N/A'}`,
      );

      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        entity: 'LabUser',
        recordEntityId: created.id.toString(),
        details: `Asignó usuario ${systemUserUuid} al laboratorio con rol ID ${roleId ?? 'sin rol'}`,
        operationData: {
          after: {
            systemUserUuid,
            roleId: roleId ?? null,
          },
        },
      });

      return created;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Crea un usuario de laboratorio con un rol específico en la base de datos correspondiente al laboratorio.
   *
   * @param labId - Identificador del laboratorio.
   * @param input - Datos para la creación del usuario de laboratorio, incluyendo el rol.
   * @param performedByUserUuid - UUID del usuario que realiza la acción.
   * @returns Una promesa que resuelve con el usuario de laboratorio creado o null.
   */
  async createLabUserWithRole(
    labId: number,
    input: CreateLabUserDto,
    performedByUserUuid: string,
  ): Promise<LabUser | null> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    await prisma.$connect();
    try {
      const role = await this.roleService.createRoleIfNotExists(
        prisma,
        input.role,
        labId,
        performedByUserUuid,
      );

      return await this.createLabUser(
        labId,
        input.systemUserUuid,
        performedByUserUuid,
        role.id,
      );
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Actualiza el rol asignado a un usuario en un laboratorio específico.
   *
   * @param labId ID del laboratorio.
   * @param userUuid UUID del usuario cuyo rol será actualizado.
   * @param roleId ID del nuevo rol a asignar.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns Una promesa que resuelve con el usuario del laboratorio actualizado.
   * @throws ConflictException si el usuario no está asignado al laboratorio.
   * @throws NotFoundException si el nuevo rol no existe.
   */
  async updateLabUserRole(
    labId: number,
    userUuid: string,
    roleId: number,
    performedByUserUuid: string,
  ): Promise<LabUser> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    try {
      this.logger.log(`🔄 Cambiando rol del usuario ${userUuid} en ${dbName}`);
      await prisma.$connect();

      // 1. Obtener el usuario actual
      const labUser = await prisma.labUser.findUnique({
        where: { systemUserUuid: userUuid },
      });

      if (!labUser) {
        throw new ConflictException(
          `El usuario no está asignado al laboratorio`,
        );
      }

      // 2. Validar que el nuevo rol exista
      const newRole = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!newRole) {
        throw new NotFoundException(`Rol con ID ${roleId} no existe`);
      }

      // 3. Actualizar el rol
      const updated = await prisma.labUser.update({
        where: { systemUserUuid: userUuid },
        data: {
          roleId: roleId,
        },
      });

      this.logger.log(
        `✅ Rol actualizado de ID ${labUser.roleId} a ${newRole.id} para el usuario ${userUuid}`,
      );

      // 4. Auditar con before y after
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'update',
        details: `Actualizó el rol asignado al usuario ${userUuid} de ID ${labUser.roleId} a ID ${newRole.id}`,
        entity: 'LabUser',
        recordEntityId: updated.id.toString(),
        operationData: {
          before: {
            roleId: labUser.roleId,
          },
          after: {
            roleId: newRole.id,
          },
        },
      });

      return updated;
    } catch (err) {
      this.logger.error(`❌ Error actualizando rol del usuario:`, err);
      throw err;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Elimina un usuario de laboratorio específico utilizando el ID del laboratorio y el UUID del usuario.
   *
   * @param labId - Identificador del laboratorio.
   * @param userUuid - UUID del usuario a eliminar.
   * @returns Una promesa que se resuelve cuando el usuario ha sido eliminado.
   */
  async deleteLabUser(labId: number, userUuid: string): Promise<void> {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);

    await prisma.labUser.delete({
      where: { systemUserUuid: userUuid },
    });
  }
}
