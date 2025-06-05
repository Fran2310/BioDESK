import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabPrismaService } from 'src/lab-prisma/services/lab-prisma.service';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserService } from 'src/user/user.service';
import { AuditService } from 'src/audit/audit.service';

/**
 * Servicio encargado de gestionar roles dentro de un laboratorio, incluyendo su creación, actualización, eliminación y consulta.
 * Permite obtener roles por nombre o ID, listar roles con paginación, obtener usuarios asociados a un rol y auditar todas las operaciones relevantes.
 * Lanza excepciones en caso de errores de validación, duplicidad, inexistencia o restricciones de negocio.
 */
@Injectable()
export class RoleService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Busca y retorna un rol único por su nombre utilizando LabPrismaService.
   *
   * @param prisma Instancia de LabPrismaService para acceder a la base de datos.
   * @param roleName Nombre del rol a buscar.
   * @returns Promesa que resuelve con el rol encontrado o null si no existe.
   */
  async getRoleByName(prisma: LabPrismaService, roleName: string) {
    return prisma.role.findUnique({
      where: { role: roleName },
    });
  }

  /**
   * Obtiene un rol por su ID utilizando el servicio LabPrismaService.
   *
   * @param prisma Instancia de LabPrismaService para acceder a la base de datos.
   * @param roleId ID numérico del rol a buscar.
   * @returns Promesa que resuelve con el rol encontrado o null si no existe.
   */
  async getRoleById(prisma: LabPrismaService, roleId: number) {
    return prisma.role.findUnique({
      where: { id: roleId },
    });
  }

  /**
   * Obtiene una lista paginada de todos los roles y el total de registros.
   *
   * @param prisma Instancia de LabPrismaService para acceder a la base de datos.
   * @param options Opcional. Parámetros de paginación: limit (límite de resultados) y offset (desplazamiento).
   * @returns Un objeto con los roles encontrados, el total, el límite y el offset aplicados.
   */
  async getAllRoles(
    prisma: LabPrismaService,
    options?: { limit?: number; offset?: number },
  ) {
    const { limit = 10, offset = 0 } = options || {};

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        skip: offset,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.role.count(),
    ]);

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  /**
   * Obtiene los usuarios asociados a un rol específico por su ID.
   * Lanza una ConflictException si no se encuentran usuarios para el rol dado.
   * Retorna un arreglo con los campos básicos de cada usuario: ci, name, lastName y email.
   *
   * @param prisma Instancia de LabPrismaService para acceder a la base de datos del laboratorio.
   * @param roleId ID del rol para buscar los usuarios asociados.
   * @returns Promesa que resuelve con un arreglo de objetos de usuario.
   */
  async getUsersByRoleId(prisma: LabPrismaService, roleId: number) {
    const labUsers = await prisma.labUser.findMany({
      where: { roleId },
      select: { systemUserUuid: true }, // Solo necesitamos los UUID
    });

    if (labUsers.length === 0) {
      throw new ConflictException(
        `No se encontraron usuarios asociados al rol con ID ${roleId}`,
      );
    }

    // Consultar la info del usuario en la base de datos del sistema
    const users = await Promise.all(
      labUsers.map((labUser) =>
        this.userService.getSystemUser({
          uuid: labUser.systemUserUuid,
          includeLabs: false,
        }),
      ),
    );

    // Mapear solo los campos necesarios
    return users.map((u) => ({
      ci: u.ci,
      name: u.name,
      lastName: u.lastName,
      email: u.email,
    }));
  }

  /**
   * Crea un nuevo rol en la base de datos si no existe, utilizando la información proporcionada en el RoleDto.
   * Registra la acción en el sistema de auditoría.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param roleDto Datos del rol a crear.
   * @param labId Identificador del laboratorio asociado.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El rol existente o el nuevo rol creado.
   */
  async createRoleIfNotExists(
    prisma: LabPrismaService,
    roleDto: RoleDto,
    labId: number,
    performedByUserUuid: string,
  ) {
    const role = await this.getRoleByName(prisma, roleDto.name);

    if (role) return role;

    const created = await prisma.role.create({
      data: {
        role: roleDto.name,
        description: roleDto.description,
        permissions: JSON.parse(JSON.stringify(roleDto.permissions)),
      },
    });

    // Auditoría
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      entity: 'Role',
      recordEntityId: created.id.toString(),
      details: `Se creó el rol "${created.role}"`,
      operationData: {
        after: {
          name: created.role,
          description: created.description,
          permissions: created.permissions,
        },
      },
    });

    return created;
  }

  /**
   * Actualiza un rol existente por su ID en la base de datos del laboratorio.
   * Valida que al menos un campo de actualización sea proporcionado, verifica la existencia del rol,
   * realiza la actualización y registra la acción en el sistema de auditoría.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param roleId ID del rol a actualizar.
   * @param update Datos de actualización del rol.
   * @param labId ID del laboratorio asociado.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El rol actualizado.
   * @throws BadRequestException Si no se proporciona ningún campo para actualizar.
   * @throws NotFoundException Si el rol no existe.
   */
  async updateRoleById(
    prisma: LabPrismaService,
    roleId: number,
    update: UpdateRoleDto,
    labId: number,
    performedByUserUuid: string,
  ) {
    // 1. Validar que al menos un campo venga
    const { name, description, permissions } = update;

    if (!name && !description && !permissions) {
      throw new BadRequestException(
        'Debes proporcionar al menos un campo para actualizar',
      );
    }

    // 2. Verificar existencia del rol
    const existing = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existing) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // 3. Actualizar campos
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { role: name }),
        ...(description && { description }),
        ...(permissions && {
          permissions: JSON.parse(JSON.stringify(permissions)),
        }),
      },
    });

    // 4. Auditoria
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      entity: 'Role',
      recordEntityId: roleId.toString(),
      details: `Actualizó el rol "${existing.role}"`,
      operationData: {
        before: {
          name: existing.role,
          description: existing.description,
          permissions: existing.permissions,
        },
        after: {
          name: updatedRole.role,
          description: updatedRole.description,
          permissions: updatedRole.permissions,
        },
      },
    });

    return updatedRole;
  }

  /**
   * Elimina un rol por su ID, asegurando que no sea el rol "admin" ni esté asignado a usuarios.
   * Lanza excepciones si el rol no existe, es "admin" o está en uso.
   * Registra la acción en el sistema de auditoría.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param roleId ID del rol a eliminar.
   * @param labId ID del laboratorio asociado.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns Mensaje de éxito tras la eliminación.
   * @throws NotFoundException si el rol no existe.
   * @throws BadRequestException si el rol es "admin" o está asignado a usuarios.
   */
  async deleteRoleById(
    prisma: LabPrismaService,
    roleId: number,
    labId: number,
    performedByUserUuid: string,
  ): Promise<{ message: string }> {
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${roleId} no existe`);
    }

    if (role.role === 'admin' || roleId === 1) {
      throw new BadRequestException('No puedes eliminar el rol "admin"');
    }

    const assignedUsersCount = await prisma.labUser.count({
      where: { roleId },
    });

    if (assignedUsersCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol porque está asignado a ${assignedUsersCount} usuario(s)`,
      );
    }

    await prisma.role.delete({ where: { id: roleId } });

    // 🔍 Auditoría
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      entity: 'Role',
      recordEntityId: roleId.toString(),
      details: `Eliminó el rol "${role.role}"`,
      operationData: {
        before: {
          name: role.role,
          description: role.description,
          permissions: role.permissions,
        },
      },
    });

    return { message: `Rol ${role.role} eliminado correctamente` };
  }
}
