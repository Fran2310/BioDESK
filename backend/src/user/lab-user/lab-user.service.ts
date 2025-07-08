// /src/user/lab-user/lab-user.service.ts
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateLabUserDto } from './dto/create-lab-user.dto';
import { PaginatedLabUserListDto } from './dto/lab-user-with-role.dto';

import { LabDbManageService } from '../../prisma-manager/lab-prisma/services/lab-db-manage.service';
import { RoleService } from '../../role/role.service';

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
    private readonly labDbManageService: LabDbManageService,
  ) {}

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
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

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
   * Obtiene un usuario de laboratorio específico por su UUID, incluyendo información básica de su rol asociado.
   * Busca en la base de datos del laboratorio especificado y retorna tanto los datos del usuario como detalles esenciales de su rol.
   *
   * @param labId ID del laboratorio donde se buscará el usuario.
   * @param uuid UUID único del usuario del sistema (correspondiente a systemUserUuid en labUser).
   * @returns El usuario del laboratorio encontrado con información de su rol (id, nombre y descripción), o null si no existe.
   */
  async getLabUserByUuid(labId: number, uuid: string) {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const labUser = await prisma.labUser.findUnique({
      where: { systemUserUuid: uuid },
      include: {
        role: {
          select: {
            id: true,
            role: true,
            description: true,
          },
        },
      },
    });

    return labUser;
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
    roleId?: number,
  ): Promise<LabUser> {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

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

    return created;
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
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    try {
      const role = await this.roleService.createRoleIfNotExists(
        prisma,
        input.role,
        labId,
        performedByUserUuid,
      );

      return await this.createLabUser(labId, input.systemUserUuid, role.id);
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
  ): Promise<{ oldRoleId: number | null; updated: LabUser }> {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    try {
      this.logger.log(
        `🔄 Cambiando rol del usuario ${userUuid} en labId: ${labId}`,
      );

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

      return {
        oldRoleId: labUser.roleId,
        updated,
      };
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
  async deleteLabUser(labId: number, userUuid: string): Promise<any> {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const deletedUser = await prisma.labUser.delete({
      where: { systemUserUuid: userUuid },
    });

    return deletedUser;
  }
}
