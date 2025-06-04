// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { LabPrismaFactory } from 'src/lab-prisma/lab-prisma.factory';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';

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
  ) {}

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
