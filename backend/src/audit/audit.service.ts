// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { LabPrismaFactory } from 'src/lab-prisma/lab-prisma.factory';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
  ) {}

  private async getDbNameFromLabId(labId: number): Promise<string> {
    const lab = await this.systemPrisma.lab.findUnique({
      where: { id: labId },
      select: { dbName: true },
    });

    if (!lab) {
      throw new Error(
        `No se encontró la base de datos del laboratorio con id=${labId}`,
      );
    }

    return lab.dbName;
  }

  async logAction(labId: number, userUuid: string, dto: CreateAuditLogDto) {
    const dbName = await this.getDbNameFromLabId(labId);
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
