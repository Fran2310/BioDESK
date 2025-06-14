// /src/user/system-user/system-user.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SystemPrismaService } from '../../prisma-manage/system-prisma/system-prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateSystemUserDto } from '../dto/update-system-user.dto';

@Injectable()
export class SystemUserService {
  private readonly logger = new Logger(SystemUserService.name);

  constructor(private readonly systemPrisma: SystemPrismaService) {}

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
      throw new NotFoundException('Usuario no encontrado.');
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
   * Recupera múltiples usuarios del sistema por sus UUIDs y retorna un objeto
   * donde cada clave es el UUID y el valor contiene el CI, nombre y apellido.
   *
   * @param uuids - Lista de UUIDs de los usuarios a buscar.
   * @returns Un objeto con los datos básicos de cada usuario indexados por UUID.
   */
  async batchFinderSystemUsers(
    uuids: string[],
  ): Promise<Record<string, { ci: string; name: string; lastName: string }>> {
    const users = await this.systemPrisma.systemUser.findMany({
      where: { uuid: { in: uuids } },
      select: { uuid: true, ci: true, name: true, lastName: true },
    });

    return users.reduce((acc, user) => {
      acc[user.uuid] = user;
      return acc;
    }, {});
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
   * Actualiza la información de un usuario del sistema.
   *
   * Valida que al menos un campo (nombre, apellido o email) sea proporcionado para actualizar.
   * Verifica que el usuario esté asignado al laboratorio especificado y que el nuevo email, si se proporciona, no esté en uso.
   * Retorna el estado previo y el actualizado del usuario.
   *
   * @param userUuid UUID del usuario a actualizar.
   * @param dto Datos a actualizar del usuario.
   * @param labId ID del laboratorio para verificar permisos.
   * @throws BadRequestException Si no se proporciona ningún campo a actualizar.
   * @throws ConflictException Si el usuario no está asignado al laboratorio o el email ya está en uso.
   * @returns Objeto con los datos previos y actualizados del usuario.
   */
  async updateUserInfo(
    userUuid: string,
    dto: UpdateSystemUserDto,
    labId: number,
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

    // Verificar si está asignado al laboratorio
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

    // Verificar unicidad de email (si se está actualizando)
    if (email && email !== user.email) {
      const emailExists = await this.systemPrisma.systemUser.findFirst({
        where: { email },
      });
      if (emailExists)
        throw new ConflictException(`El email ${email} ya está en uso`);
    }

    // Guardar el estado previo para auditoría
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

    return {
      before,
      updated: {
        uuid: updated.uuid,
        name: updated.name,
        lastName: updated.lastName,
        email: updated.email,
      },
    };
  }

  /**
   * Asocia un usuario del sistema a un laboratorio en la base de datos central (SystemPrisma).
   * No lanza error si ya están relacionados.
   *
   * @param userUuid UUID del usuario.
   * @param labId ID del laboratorio.
   */

  async changePasswordByEmail(email: string, newPassword: string) {
    // 1. Verificar que el usuario existe
    const user = await this.getSystemUser({ email });
    if (!user) {
      throw new ConflictException(`Usuario con email ${email} no encontrado.`);
    }

    // 2. Generar nuevo salt y hash para la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Actualizar usuario en la base de datos
    await this.systemPrisma.systemUser.update({
      where: { uuid: user.uuid },
      data: {
        password: hashedPassword,
        salt,
      },
    });

    this.logger.log(`Contraseña actualizada para el email: ${email}`);
  }

  /**
   * Asocia un usuario del sistema a un laboratorio específico si aún no existe la relación.
   *
   * @param userUuid UUID del usuario del sistema.
   * @param labId ID del laboratorio al que se desea asociar el usuario.
   * @returns Promise que se resuelve cuando la asociación se ha realizado exitosamente o si ya existía.
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
   * Elimina un usuario del sistema por su UUID.
   *
   * Busca el usuario junto con sus laboratorios asignados y valida que no esté asociado a ninguno.
   * Si el usuario está asignado a uno o más laboratorios, lanza una ConflictException.
   * Si no tiene laboratorios asignados, procede a eliminar el usuario y retorna el registro eliminado.
   *
   * @param userUuid UUID del usuario a eliminar.
   * @returns El usuario eliminado.
   * @throws ConflictException Si el usuario está asignado a algún laboratorio.
   */
  async deleteSystemUser(userUuid: string) {
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

    return deleted;
  }
}
