// backend/src/user/user.service.ts
import {
  Injectable,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabUserService } from 'src/lab-user/lab-user.service';
import { LabService } from 'src/lab/services/lab.service';
import { LabDbManageService } from 'src/lab-prisma/services/lab-db-manage.service';
import { AuditService } from 'src/audit/audit.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { RoleDto } from 'src/role/dto/role.dto';
import { SystemUser } from '@prisma/client-system';
import { DEFAULT_ADMIN_ROLE } from 'src/role/constants/default-role';
import { UpdateSystemUserDto } from './dto/update-system-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labService: LabService,
    private readonly labUserService: LabUserService,
    private readonly auditService: AuditService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  /**
   * Valida que no existan usuarios duplicados por email o cédula.
   * @param email Email del usuario a validar.
   * @param ci Cédula del usuario a validar.
   * @throws ConflictException si ya existe un usuario con el mismo email o cédula.
   */
  async validateUniqueUser({
    email,
    ci,
  }: {
    email?: string;
    ci?: string;
  }): Promise<void> {
    const existingUser = await this.systemPrisma.systemUser.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(ci ? [{ ci }] : [])],
      },
    });

    if (!existingUser) return;

    if (email && existingUser.email === email) {
      throw new ConflictException(
        `Ya existe un usuario con el email: ${email}`,
      );
    }

    if (ci && existingUser.ci === ci) {
      throw new ConflictException(`Ya existe un usuario con la cédula: ${ci}`);
    }

    throw new ConflictException('Ya existe un usuario con datos duplicados.');
  }

  /**
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
  }): Promise<any> {
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
   * Recupera todos los usuarios del sistema asociados a un laboratorio específico.
   *
   * @param labId - ID del laboratorio.
   * @param offset - Desplazamiento para la paginación (por defecto 0).
   * @param limit - Límite de usuarios a retornar (por defecto 20).
   * @returns Un objeto con el total de usuarios y un diccionario de datos de usuario indexado por UUID.
   */
  async getAllSystemUsersByLabId(
    labId: number,
    offset = 0,
    limit = 20,
  ): Promise<{
    total: number;
    data: Record<
      string,
      { ci: string; name: string; lastName: string; email: string }
    >;
  }> {
    const [users, total] = await Promise.all([
      this.systemPrisma.systemUser.findMany({
        where: {
          labs: {
            some: {
              id: labId,
            },
          },
        },
        skip: offset,
        take: limit,
        select: {
          uuid: true,
          ci: true,
          name: true,
          lastName: true,
          email: true,
        },
      }),
      this.systemPrisma.systemUser.count({
        where: {
          labs: {
            some: {
              id: labId,
            },
          },
        },
      }),
    ]);

    const data = users.reduce(
      (acc, user) => {
        acc[user.uuid] = user;
        return acc;
      },
      {} as Record<string, (typeof users)[number]>,
    );

    return { total, data };
  }

  /**
   * Obtiene los usuarios de un laboratorio específico, con opción de incluir permisos, paginación y enriquecimiento de datos con información del usuario del sistema.
   *
   * @param labId ID del laboratorio.
   * @param includePermissions Si es true, incluye los permisos de los usuarios. Valor por defecto: false.
   * @param offset Desplazamiento para la paginación. Valor por defecto: 0.
   * @param limit Límite de usuarios a retornar. Valor por defecto: 20.
   * @returns Un objeto con los usuarios del laboratorio y sus datos enriquecidos.
   */
  async getDataLabUsers(
    labId: number,
    includePermissions = false,
    offset = 0,
    limit = 20,
  ) {
    const labUsers = await this.labUserService.getLabUsers(
      labId,
      includePermissions,
      offset,
      limit,
    );

    const systemUsersMap = await this.getAllSystemUsersByLabId(
      labId,
      offset,
      limit,
    );

    // Enriquecer datos
    const enrichedData = labUsers.data.map((item) => {
      const user = systemUsersMap.data[item.systemUserUuid];

      return {
        userData: user
          ? {
              ci: user.ci,
              name: user.name,
              lastName: user.lastName,
              email: user.email,
            }
          : undefined,
        ...item,
      };
    });

    return {
      ...labUsers,
      data: enrichedData,
    };
  }

  /**
   * Crea un nuevo usuario del sistema con los datos proporcionados y lo asocia opcionalmente a un laboratorio.
   * Valida que el correo y la cédula sean únicos, encripta la contraseña y guarda el usuario en la base de datos.
   *
   * @param dto Datos del usuario a crear.
   * @param labId (Opcional) ID del laboratorio al que se asociará el usuario.
   * @returns Promesa que resuelve con el usuario creado.
   */
  async createSystemUser(dto: CreateUserDto, labId?: number) {
    const { ci, name, lastName, email, password } = dto;

    await this.validateUniqueUser({ email, ci });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.systemPrisma.systemUser.create({
      data: {
        ci,
        name,
        lastName,
        email,
        password: hashedPassword,
        salt,
        ...(labId && {
          labs: {
            connect: [{ id: labId }],
          },
        }),
      },
    });
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
    const systemUser = await this.createSystemUser(systemUserDto, labId);

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
        details: `Creó al usuario ${systemUser.name} ${systemUser.lastName} con rol ${role.name}`,
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
    await this.labUserService.validateRoleExists(labId, roleId);

    // 2. Crear usuario en el sistema
    const systemUser = await this.createSystemUser(userDto, labId);

    // 3. Asociar al laboratorio con rol existente
    const labUser = await this.labUserService.createLabUser(
      labId,
      systemUser.uuid,
      performedByUserUuid,
      roleId,
    );

    // 4. Auditar creación
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      details: `Creó al usuario ${systemUser.name} ${systemUser.lastName} con rol ID ${roleId}`,
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
  async createUserAdminAndLab(dto: RegisterDto) {
    const { lab, ...userDto } = dto;

    const labRecord = await this.labService.createLab(lab);
    if (!labRecord) {
      throw new ConflictException('Error al crear el laboratorio.');
    }

    this.logger.log(
      `🧪 Laboratorio creado: ${labRecord.name} (${labRecord.rif})`,
    );

    try {
      // ✅ Primero creas el usuario y ya tienes el UUID
      const user = await this.createSystemUser(userDto, labRecord.id);

      // ✅ Luego lo insertas en la base de datos del laboratorio
      const labUser = await this.labUserService.createLabUserWithRole(
        labRecord.id,
        {
          systemUserUuid: user.uuid,
          role: DEFAULT_ADMIN_ROLE,
        },
        user.uuid, // Ahora sí existe el uuid del propio usuario
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
        uuid: user.uuid,
        labs: [labRecord],
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al crear el usuario administrador para el laboratorio: ${labRecord.name}. Iniciando rollback...`,
      );

      await this.systemPrisma.lab.delete({ where: { id: labRecord.id } });
      await this.labDbManageService.dropDatabase(labRecord.dbName);

      this.logger.warn(
        `🚫 Rollback completado para el laboratorio ${labRecord.name}`,
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
    const user = await this.getSystemUser({ uuid: userUuid });

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
   * Actualiza los datos básicos de un usuario del sistema (System DB).
   * Solo permite modificar: name, lastName, email.
   *
   * @param userUuid UUID del usuario a actualizar.
   * @param dto Datos a actualizar.
   * @param labId ID del laboratorio en donde se realizo la accion.
   * @param performedByUserUuid UUID de quien realiza el cambio (para auditoría).
   * @throws BadRequestException si no hay campos a actualizar.
   * @throws ConflictException si el nuevo email ya está en uso por otro usuario.
   */
  async updateSystemUserData(
    userUuid: string,
    dto: UpdateSystemUserDto,
    labId: number,
    performedByUserUuid: string,
  ) {
    const { name, lastName, email } = dto;

    if (!name && !lastName && !email) {
      throw new BadRequestException(
        'Debes enviar al menos un campo a actualizar',
      );
    }

    const user = await this.getSystemUser({
      uuid: userUuid,
      includeLabs: true,
    });

    // Verificar si el nuevo email está en uso
    if (email && email !== user.email) {
      const existingEmail = await this.systemPrisma.systemUser.findFirst({
        where: { email },
      });

      if (existingEmail) {
        throw new ConflictException(`El email ${email} ya está en uso.`);
      }
    }

    // 1. Verificar si el usuario está asignado al laboratorio
    if (user.labs) {
      const isAssignedToLab = user.labs.some((lab) => lab.id === labId);
      if (!isAssignedToLab) {
        throw new ConflictException(
          `El usuario no está asignado al laboratorio, no tiene permisos para editar`,
        );
      }
    } else {
      throw new ConflictException(
        'El usuario no está asignado a ningún laboratorio.',
      );
    }

    // 2. Guardar el estado previo para auditoría
    const before = {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
    };

    const updated = await this.systemPrisma.systemUser.update({
      where: { uuid: userUuid },
      data: {
        ...(name && { name }),
        ...(lastName && { lastName }),
        ...(email && { email }),
      },
    });

    // Auditar
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      details: `Actualizó datos de usuario ${userUuid}`,
      entity: 'SystemUser',
      recordEntityId: user.id.toString(),
      operationData: {
        before,
        after: {
          name: updated.name,
          lastName: updated.lastName,
          email: updated.email,
        },
      },
    });

    return {
      message: 'Usuario actualizado correctamente',
      updated: {
        uuid: updated.uuid,
        name: updated.name,
        lastName: updated.lastName,
        email: updated.email,
      },
    };
  }

  /**
   * Elimina la asignación de un usuario del sistema (solamente de la db central) a un laboratorio específico.
   *
   * @param labId ID del laboratorio del que se desea desvincular al usuario.
   * @param userUuid UUID del usuario del sistema.
   * @throws ConflictException Si el usuario no está asignado al laboratorio indicado.
   * @returns Promise<void>
   */
  async deleteAssignedSystemUser(
    labId: number,
    userUuid: string,
  ): Promise<void> {
    const user = await this.getSystemUser({
      uuid: userUuid,
      includeLabs: true,
    });

    const isAssigned = user.labs.some((lab) => lab.id === labId);
    if (!isAssigned) {
      throw new ConflictException(
        `El usuario no está asignado al laboratorio con ID ${labId}`,
      );
    }

    await this.systemPrisma.systemUser.update({
      where: { uuid: userUuid },
      data: {
        labs: {
          disconnect: [{ id: labId }],
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
    const user = await this.getSystemUser({ uuid: userUuid });

    // 1. Eliminar relación en DB del laboratorio
    await this.labUserService.deleteLabUser(labId, userUuid);

    // 2. Eliminar relación en DB central
    await this.deleteAssignedSystemUser(labId, userUuid);

    // 3. Auditar acción
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      details: `Se eliminó la asignación del usuario ${user.name} ${user.lastName} del laboratorio`,
      entity: 'LabUser',
      recordEntityId: user.uuid,
      operationData: {
        before: {
          userUuid,
          labId,
        },
      },
    });

    return {
      message: `Usuario ${user.email} eliminado del laboratorio exitosamente.`,
    };
  }

  /**
   * Elimina completamente un usuario del sistema, asegurando que no esté asignado a ningún laboratorio.
   * Registra la acción en el sistema de auditoría.
   *
   * @param labId ID del laboratorio desde el cual se realiza la acción.
   * @param userUuid UUID del usuario a eliminar.
   * @param performedByUserUuid UUID del usuario que realiza la eliminación.
   * @throws ConflictException Si el usuario está asignado a uno o más laboratorios.
   * @returns Mensaje de confirmación de eliminación.
   */
  async deleteTotalSystemUser(
    labId: number,
    userUuid: string,
    performedByUserUuid: string,
  ) {
    // 1. Buscar el usuario incluyendo sus laboratorios
    const user = await this.getSystemUser({
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
    const deleted = await this.systemPrisma.systemUser.delete({
      where: { uuid: userUuid },
    });

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
      message: `Usuario ${deleted.name} eliminado completamente del sistema.`,
    };
  }
}
