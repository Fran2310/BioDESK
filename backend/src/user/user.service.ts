// backend/src/user/user.service.ts
import { Injectable, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { DEFAULT_ADMIN_ROLE } from 'src/role/constants/default-role';

import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateLabDto } from 'src/lab/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/system-user/dto/create-user.dto';
import { UpdateSystemUserDto } from './system-user/dto/update-system-user.dto';
import { RoleDto } from 'src/role/dto/role.dto';

import { LabService } from 'src/lab/services/lab.service';
import { LabUserService } from 'src/user/lab-user/lab-user.service';
import { RoleService } from '../role/role.service';
import { SystemUserService } from './system-user/system-user.service';
import { AuditService } from 'src/audit/audit.service';
import { AssignExistingUserDto } from './lab-user/dto/assign-existing-user.dto';
import { MailService } from 'src/mail/mail.service';
import { intelligentSearch } from 'src/common/services/intelligentSearch.service';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';
import { SystemPrismaService } from 'src/prisma-manager/system-prisma/system-prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly labService: LabService,

    readonly labUserService: LabUserService,
    readonly systemUserService: SystemUserService,
    private readonly mailService: MailService,
    private readonly roleService: RoleService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
    private readonly systemPrisma: SystemPrismaService,
  ) {}

  /**
   * Obtiene los usuarios de un laboratorio específico, con opción de incluir permisos, paginación y enriquecimiento de datos con información del usuario del sistema.
   *
   * @param labId ID del laboratorio.
   * @param includePermissions Si es true, incluye los permisos de los usuarios. Valor por defecto: false.
   * @param offset Desplazamiento para la paginación. Valor por defecto: 0.
   * @param limit Límite de usuarios a retornar. Valor por defecto: 20.
   * @returns Un objeto con los usuarios del laboratorio y sus datos enriquecidos.
   */

  async getDataUserMe(performedByUserUuid: string) {
    const user = await this.systemUserService.getSystemUser({ uuid: performedByUserUuid });
    const { password, salt, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async getDataLabUsers(
    labId: number,
    includePermissions = false,
    offset = 0,
    limit = 20,
    searchTerm?: string,
    searchFields?: string[],
  ) {
    const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
    // ALERTA FUNCIÓN TOCHA Y DIFICIL DE MANTENER

    // Opciones para intelligentSearch en labUserService
    const labUsersSearchOptions = {
      skip: offset,
      take: limit,
      omit: {
        roleId: true
      },
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
    };

    // Obtener usuarios del laboratorio con filtro inteligente
    const { results: labUsersResults, total: labUsersTotal } = await intelligentSearch(
      labPrisma.labUser,
      labUsersSearchOptions,
    );

    // Obtener UUIDs de los usuarios del sistema encontrados
    const systemUserUuids = labUsersResults.map(item => item.systemUserUuid);

    // Si no hay usuarios en el laboratorio, devolver respuesta vacía
    if (systemUserUuids.length === 0) {
      return {
        total: 0,
        offset,
        limit,
        data: [],
      };
    }

    // Opciones para intelligentSearch en systemUserService
    const systemUsersSearchOptions = {
      skip: 0, // No necesitamos paginación aquí ya que filtramos por UUIDs
      take: systemUserUuids.length,
      where: {
        uuid: { in: systemUserUuids },
      }
    };

    // Obtener usuarios del sistema con filtro inteligente
    const { results: systemUsersResults } = await intelligentSearch(
      this.systemPrisma.systemUser,
      systemUsersSearchOptions,
      searchTerm,
      searchFields,
    );

    // Crear mapa de usuarios del sistema para enriquecimiento
    const systemUsersMap = systemUsersResults.reduce((acc, user) => {
      acc[user.uuid] = user;
      return acc;
    }, {});

    // Filtrar y enriquecer datos
    const enrichedData = labUsersResults.map((labUser) => {
      const systemUser = systemUsersMap[labUser.systemUserUuid];
      
      if (!systemUser) return null; // Filtrar usuarios sin systemUser

      return { // Devuelve los dos users de las dos tablas diferentes
        systemUser: { // Acá filtramos para no devolver datos sensibles
          id: systemUser.id,
          uuid: systemUser.uuid,
          ci: systemUser.ci,
          name: systemUser.name,
          lastName: systemUser.lastName,
          email: systemUser.email,
          isActive: systemUser.isActive,
          lastAccess: systemUser.lastAccess
        },
        labUser,
      };
    })
    .filter(item => item !== null); // Eliminar nulls del array

    // Actualizar el total real (puede ser menor si filtramos algunos registros)
    const filteredTotal = enrichedData.length;

    return {
      total: labUsersTotal,
      offset,
      limit,
      data: enrichedData, // Ahora devolvemos los datos combinados
    };
  }

  /**
   * Crea un usuario y rol para asignarlo a un laboratorio.
   * @param labId ID del laboratorio al que se asignará el usuario y rol.
   * @param systemUserDto Datos del usuario a crear.
   * @param role datos del rol a crear que se asignará al usuario.
   * @param performedByUserUuid UUID del usuario que realiza la acción (opcional, para auditoría).
   * @returns Información del usuario creado.
   */
  async createUserWithRoleToLab(
    labId: number,
    systemUserDto: CreateUserDto,
    role: RoleDto,
    performedByUserUuid: string,
  ) {
    const systemUser = await this.systemUserService.createSystemUser(
      systemUserDto,
      labId,
    );

    const labUser = await this.labUserService.createLabUserWithRole(
      labId,
      {
        systemUserUuid: systemUser.uuid,
        role,
      },
      performedByUserUuid,
    );

    if (labUser) {
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `Creó al usuario ${systemUser.name} ${systemUser.lastName} y rol ${role.name}`,
        entity: 'LabUser',
        recordEntityId: labUser.id.toString(),
        operationData: {
          after: {
            ciField: systemUser.ci,
            nameField: systemUser.name,
            lastNameField: systemUser.lastName,
            emailField: systemUser.email,
            role: role.name,
          },
        },
      });
    }
    return {
      uuid: systemUser.uuid,
      email: systemUser.email,
    };
  }

  async createUserWithExistingRole(
    labId: number,
    userDto: CreateUserDto,
    roleId: number,
    performedByUserUuid: string,
  ): Promise<{ uuid: string; email: string }> {
    // 1. Verificar que el rol exista
    const role = await this.roleService.validateRoleExists(labId, roleId);

    // 2. Crear usuario en el sistema
    const systemUser = await this.systemUserService.createSystemUser(
      userDto,
      labId,
    );

    // 3. Asociar al laboratorio con rol existente
    const labUser = await this.labUserService.createLabUser(
      labId,
      systemUser.uuid,
      roleId,
    );

    // 4. Auditar creación
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      details: `Creó al usuario ${systemUser.name} ${systemUser.lastName} con rol ${role.role}`,
      entity: 'LabUser',
      recordEntityId: labUser.id.toString(),
      operationData: {
        after: {
          ciField: systemUser.ci,
          nameField: systemUser.name,
          lastNameField: systemUser.lastName,
          emailField: systemUser.email,
          roleId,
        },
      },
    });

    return {
      uuid: systemUser.uuid,
      email: systemUser.email,
    };
  }

  /**
   * Crea un nuevo laboratorio y un usuario del sistema asociado a él como administrador.
   * @param dto Datos del registro que incluye el laboratorio y el usuario.
   * @returns Información del usuario creado(uuid) y el laboratorio registrado.
   * @throws ConflictException si ocurre un error al crear el laboratorio o el usuario.
   * Si ocurre un error al crear el usuario, se realiza un rollback eliminando el laboratorio creado.
   */
  async createUser(dto: RegisterDto) {
    const userDto = dto;

    try {
      await this.mailService.sendWelcomeEmail(userDto); // Colocar esto de primero si se quiere hacer la verificación por correo
      const user = await this.systemUserService.createSystemUser( // ✅ Primero creas el usuario y ya tienes el UUID
        userDto,
      );
      
      return {
        uuid: user.uuid,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al crear el usuario ${error}`,
      );
      throw error;
    }
  }

  /**
   * Crea un laboratorio para un usuario específico existente.
   * @param userUuid UUID del usuario al que se le asociará el laboratorio.
   * @param dto Datos del laboratorio a crear.
   * @returns Información del laboratorio creado.
   */
  async createLabForUser(userUuid: string, dto: CreateLabDto) {
    // 1. Verifica que el usuario existe
    const user = await this.systemUserService.getSystemUser({ uuid: userUuid });

    // 2. Crea el laboratorio
    const labRecord = await this.labService.createLab(dto, user.id);
    if (!labRecord) {
      throw new ConflictException('Error al crear el laboratorio.');
    }
    this.logger.log(
      `🧪 Laboratorio creado: ${labRecord.name} (${labRecord.rif})`,
    );
    // Inserta en la DB dinámica el usuario como admin del nuevo lab
    const labUser = await this.labUserService.createLabUserWithRole(
      labRecord.id,
      {
        systemUserUuid: user.uuid,
        role: DEFAULT_ADMIN_ROLE,
      },
      userUuid,
    );

    // 🗒️ Auditar creación de LabUser como administrador inicial
    if (labUser) {
      await this.auditService.logAction(labRecord.id, user.uuid, {
        action: 'create',
        details: `Creó al usuario administrador ${user.name} ${user.lastName}`,
        entity: 'LabUser',
        recordEntityId: labUser.id.toString(),
        operationData: {
          after: {
            ciField: user.ci,
            nameField: user.name,
            lastNameField: user.lastName,
            emailField: user.email,
            role: DEFAULT_ADMIN_ROLE.name,
          },
        },
      });
    }
    this.logger.log(
      `🧪 Usuario registrado: ${user.email} → Lab: ${labRecord.name}`,
    );

    return {
      id: labRecord.id,
      name: labRecord.name,
      rif: labRecord.rif,
      status: labRecord.status,
      createdAt: labRecord.createdAt,
    };
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
  async assignExistUserToLab(
    labId: number,
    dto: AssignExistingUserDto,
    performedByUserUuid: string,
  ) {
    // 1. Buscar usuario
    const user = await this.systemUserService.getSystemUser({
      uuid: dto.uuid,
      email: dto.email,
      ci: dto.ci,
    });

    // 2. Validar que el rol exista en el laboratorio
    const role = await this.roleService.validateRoleExists(labId, dto.roleId);

    // 3. Insertar en LabUser
    const labUser = await this.labUserService.createLabUser(
      labId,
      user.uuid,
      dto.roleId,
    );

    // 2. Asociarlo a la DB central (si no lo está)
    await this.systemUserService.linkSystemUserToLab(user.uuid, labId);

    await this.mailService.sendWelcomeToLabEmail(user.email, labId, role.role)

    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      details: `Asignó usuario existente ${user.name} ${user.lastName} al laboratorio con rol ${role.role}`,
      entity: 'LabUser',
      recordEntityId: labUser.id.toString(),
      operationData: {
        after: {
          systemUserUuid: user.uuid,
          roleId: dto.roleId,
        },
      },
    });
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
   * Actualiza los datos de un usuario del sistema y registra la acción en el servicio de auditoría.
   *
   * @param userUuid UUID del usuario a actualizar.
   * @param dto Datos actualizados del usuario.
   * @param labId ID del laboratorio asociado.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns Un objeto con un mensaje de éxito y los datos actualizados del usuario.
   */
  async updateSystemUserData(
    userUuid: string,
    dto: UpdateSystemUserDto,
    labId: number,
    performedByUserUuid: string,
  ) {
    const { before, updated } = await this.systemUserService.updateUserInfo(
      userUuid,
      dto,
      labId,
    );

    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      entity: 'SystemUser',
      recordEntityId: updated.uuid,
      details: `Actualizó datos del usuario ${updated.name} ${updated.lastName}`,
      operationData: {
        before,
        after: updated,
      },
    });

    return {
      message: 'Usuario actualizado correctamente',
      updated,
    };
  }

  async updateUserRole(
    labId: number,
    userUuid: string,
    roleId: number,
    performedByUserUuid: string,
  ) {
    const userRole = await this.labUserService.updateLabUserRole(
      labId,
      userUuid,
      roleId,
    );

    //obtener data para auditoria
    const userdata = await this.systemUserService.getSystemUser({
      uuid: userUuid,
    });

    let oldRoleData = { role: '' };
    if (userRole.oldRoleId !== null) {
      oldRoleData = await this.roleService.validateRoleExists(
        labId,
        userRole.oldRoleId,
      );
    }

    let newRoleData = { role: '' };
    if (userRole.updated.roleId !== null) {
      newRoleData = await this.roleService.validateRoleExists(
        labId,
        userRole.updated.roleId,
      );
    }
    // Auditar con before y after
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      details: `Actualizó el rol asignado al usuario ${userdata.name} ${userdata.lastName} del rol ${oldRoleData.role ? oldRoleData.role : userRole.oldRoleId} al rol ${newRoleData.role ? newRoleData.role : userRole.updated.roleId}`,
      entity: 'LabUser',
      recordEntityId: userRole.updated.id.toString(),
      operationData: {
        before: {
          roleId: userRole.oldRoleId,
        },
        after: {
          roleId: userRole.updated.roleId,
        },
      },
    });
  }

  /**
   * Elimina la asignación de un usuario a un laboratorio, removiendo la relación tanto en la base de datos del laboratorio como en la central.
   * Registra la acción en el sistema de auditoría.
   *
   * @param labId - ID del laboratorio del que se elimina el usuario.
   * @param userUuid - UUID del usuario a eliminar.
   * @param performedByUserUuid - UUID del usuario que realiza la acción.
   * @returns Un mensaje indicando que el usuario fue eliminado exitosamente del laboratorio.
   */
  async deleteAssignedUserToLab(
    labId: number,
    userUuid: string,
    performedByUserUuid: string,
  ): Promise<{ message: string }> {
    const user = await this.systemUserService.getSystemUser({ uuid: userUuid });

    // 1. Eliminar relación en DB del laboratorio
    const deletedUser = await this.labUserService.deleteLabUser(
      labId,
      userUuid,
    );

    // 2. Eliminar relación en DB central
    await this.systemUserService.deleteAssignedSystemUser(labId, userUuid);

    // 3. Auditar acción
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      details: `Se eliminó la asignación del usuario ${user.name} ${user.lastName} del laboratorio`,
      entity: 'LabUser',
      recordEntityId: `${deletedUser.id}`,
      operationData: {
        before: deletedUser,
      },
    });

    return {
      message: `Usuario ${user.email} eliminado del laboratorio exitosamente.`,
    };
  }

  /**
   * Elimina completamente un usuario del sistema, asegurando que no esté asignado a ningún laboratorio.
   *
   * @param labId ID del laboratorio desde el cual se realiza la acción.
   * @param userUuid UUID del usuario a eliminar.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @throws ConflictException Si el usuario está asignado a uno o más laboratorios o si ocurre un error al eliminarlo.
   * @returns Un mensaje confirmando la eliminación exitosa del usuario.
   */
  async deleteTotalSystemUser(
    labId: number,
    userUuid: string,
    performedByUserUuid: string,
  ) {
    // 1. Buscar el usuario incluyendo sus laboratorios
    const user = await this.systemUserService.getSystemUser({
      uuid: userUuid,
      includeLabs: true,
    });

    // 2. Validar que no esté asignado a ningún laboratorio
    if (user.labs.length > 0) {
      throw new ConflictException(
        `El usuario no puede eliminarse porque está asignado a ${user.labs.length} laboratorio(s).`,
      );
    }

    // 3. Eliminar el usuario del sistema
    const deleted = await this.systemUserService.deleteSystemUser(userUuid);
    if (!deleted) {
      throw new ConflictException('Error al eliminar el usuario del sistema.');
    }

    // 4. Auditar eliminación
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      entity: 'SystemUser',
      recordEntityId: deleted.id.toString(),
      details: `Se eliminó completamente al usuario ${deleted.name} ${deleted.lastName} del sistema`,
      operationData: {
        before: {
          ci: deleted.ci,
          name: deleted.name,
          lastName: deleted.lastName,
          email: deleted.email,
        },
        after: null,
      },
    });

    return {
      message: `Usuario ${deleted.name} ${deleted.lastName} eliminado completamente del sistema.`,
    };
  }

  async getLabList(uuid: string) {

    const user = await this.systemUserService.getSystemUser({
      uuid, 
      includeLabs: true
    })

    if (!user?.labs?.length) {
      throw new NotFoundException(
        'Este usuario no está asociado a ningún laboratorio.',
      );
    }

    return {
      labs: user.labs.map((lab) => ({
        id: lab.id,
        name: lab.name,
        status: lab.status,
        rif: lab.rif,
        logoPath: lab.logoPath,
      })),
    };
  }
}
