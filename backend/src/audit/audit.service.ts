// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { LabPrismaFactory } from 'src/prisma-manage/lab-prisma/lab-prisma.factory';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SystemPrismaService } from 'src/prisma-manage/system-prisma/system-prisma.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

@Injectable()
export class AuditService {
  /**
   * Servicio encargado de registrar acciones de auditoría en la base de datos correspondiente a cada laboratorio.
   * Utiliza SystemPrismaService para obtener el nombre de la base de datos según el laboratorio y LabPrismaFactory para crear la instancia de conexión.
   * El método logAction almacena el historial de acciones realizadas por usuarios sobre entidades específicas.
   */
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
    private readonly systemUserService: SystemUserService,
  ) {}

  /**
   * Recupera el historial de acciones para un laboratorio específico, con soporte para paginación y opción de incluir datos detallados.
   *
   * @param labId ID del laboratorio.
   * @param offset Número de registros a omitir (por defecto 0).
   * @param limit Cantidad máxima de registros a retornar (por defecto 20).
   * @param includeData Si es verdadero, incluye los datos de la operación (por defecto true).
   * @returns Un objeto con el total de registros, offset, limit y los datos del historial.
   */
  async getActionHistory(
    labId: number,
    offset = 0,
    limit = 20,
    includeData = true,
  ) {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const prisma = this.labPrismaFactory.createInstanceDB(dbName);
    await prisma.$connect();

    const [total, logs] = await Promise.all([
      prisma.actionHistory.count(),
      prisma.actionHistory.findMany({
        skip: offset,
        take: limit,
        omit: { operationData: !includeData, labUserId: true },
        include: {
          labUser: {
            select: {
              systemUserUuid: true,
            },
          },
        },
      }),
    ]);

    await prisma.$disconnect();

    return { total, offset, limit, data: logs };
  }

  /**
   * Recupera los registros de auditoría para un laboratorio específico, con paginación y opción de incluir datos adicionales.
   * Enriquese cada registro con la información del usuario que realizó la acción.
   * diferencia con getActionHistory, este método incluye la información detallada del usuario que realizó la acción.
   *
   * @param labId - ID del laboratorio.
   * @param offset - Desplazamiento para la paginación (por defecto 0).
   * @param limit - Límite de registros a retornar (por defecto 20).
   * @param includeData - Si se deben incluir datos adicionales (por defecto false).
   * @returns Una promesa que resuelve con los registros de auditoría enriquecidos.
   */
  async getAuditLogs(
    labId: number,
    offset = 0,
    limit = 20,
    includeData = false,
  ): Promise<any> {
    const logsResult = await this.getActionHistory(
      labId,
      offset,
      limit,
      includeData,
    );

    const uuids = logsResult.data
      .map((log) => log.labUser?.systemUserUuid)
      .filter(Boolean);

    const usersMap = await this.systemUserService.batchFinderSystemUsers(uuids);

    const enrichedLogs = logsResult.data.map(({ labUser, ...rest }) => ({
      ...rest,
      performedBy: labUser?.systemUserUuid
        ? (usersMap[labUser.systemUserUuid] ?? {
            ci: '',
            name: '',
            lastName: '',
          })
        : null,
    }));

    return {
      ...logsResult,
      data: enrichedLogs,
    };
  }

  /**
   * Registra una acción de auditoría en la base de datos del laboratorio.
   * @param labId ID del laboratorio donde se registrará la acción.
   * @param userUuid UUID del usuario que realiza la acción.
   * @param dto Objeto que contiene los detalles de la acción a registrar.
   */
  async logAction(labId: number, userUuid: string, dto: CreateAuditLogDto) {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    const labPrisma = this.labPrismaFactory.createInstanceDB(dbName);

    const labUser = await labPrisma.labUser.findUnique({
      where: { systemUserUuid: userUuid },
    });

    if (!labUser) return;

    await labPrisma.actionHistory.create({
      data: {
        action: dto.action,
        details: dto.details,
        entity: dto.entity,
        recordEntityId: dto.recordEntityId,
        operationData: dto.operationData,
        labUserId: labUser.id,
      },
    });
  }
}
