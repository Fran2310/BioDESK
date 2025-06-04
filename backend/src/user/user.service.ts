// backend/src/user/user.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { LabUserService } from 'src/lab-user/lab-user.service';
import { LabService } from 'src/lab/services/lab.service';
import { AuditService } from 'src/audit/audit.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { RoleDto } from 'src/role/dto/role.dto';
import { SystemUser } from '@prisma/client-system';
import { DEFAULT_ADMIN_ROLE } from 'src/role/constants/default-role';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly labService: LabService,
    private readonly labUserService: LabUserService,
    private readonly auditService: AuditService,
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
   * Crea un usuario del sistema y lo asigna a un laboratorio con un rol específico.
   * @param labId ID del laboratorio al que se asignará el usuario.
   * @param systemUserDto Datos del usuario a crear.
   * @param role Rol que se asignará al usuario en el laboratorio.
   * @param performedByUserUuid UUID del usuario que realiza la acción (opcional, para auditoría).
   * @returns Información del usuario creado.
   */
  async createUserAndAssignToLab(
    labId: number,
    systemUserDto: CreateUserDto,
    role: RoleDto,
    performedByUserUuid?: string,
  ) {
    const { ci, name, lastName, email, password } = systemUserDto;

    // 1. Validar duplicado en DB del sistema
    await this.validateUniqueUser({ email, ci });

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
    const dbName = await this.systemPrisma.getLabDbName(labId);

    // 4. Insertar en la base de datos del laboratorio
    await this.labUserService.createLabUser(dbName, {
      systemUserUuid: systemUser.uuid,
      role,
    });

    // 5. Registrar auditoría si se especifica un usuario que realizó la acción
    if (performedByUserUuid) {
      await this.auditService.logAction(labId, performedByUserUuid, {
        action: 'create',
        details: `Creó al usuario ${name} ${lastName} con rol ${role.name}`,
        entity: 'LabUser',
        recordEntityId: systemUser.uuid,
        operationData: {
          after: {
            ciField: ci,
            nameField: name,
            lastNameField: lastName,
            emailField: email,
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

  /**
   * Crea un nuevo laboratorio y un usuario del sistema asociado a él como administrador.
   * @param dto Datos del registro que incluye el laboratorio y el usuario.
   * @returns Información del usuario creado(uuid) y el laboratorio registrado.
   */
  async createUserAdminAndLab(dto: RegisterDto) {
    const { lab, ...userDto } = dto;

    // 1. Crea el laboratorio (validando RIF y nombre únicos)
    const labRecord = await this.labService.createLab(lab);
    if (!labRecord) {
      throw new ConflictException('Error al crear el laboratorio.');
    }
    this.logger.log(
      `🧪 Laboratorio creado: ${labRecord.name} (${labRecord.rif})`,
    );

    // 3. Crea el usuario y lo asocia al laboratorio con rol admin
    const { uuid, email } = await this.createUserAndAssignToLab(
      labRecord.id,
      userDto,
      DEFAULT_ADMIN_ROLE,
    );

    this.logger.log(`🧪 Usuario registrado: ${email} → Lab: ${labRecord.name}`);

    return {
      uuid,
      labs: [labRecord],
    };
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
    await this.labUserService.createLabUser(labRecord.dbName, {
      systemUserUuid: user.uuid,
      role: DEFAULT_ADMIN_ROLE,
    });

    return {
      id: labRecord.id,
      name: labRecord.name,
      rif: labRecord.rif,
      status: labRecord.status,
      createdAt: labRecord.createdAt,
    };
  }
}
