// /src/lab/services/lab.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { LabPrismaFactory } from 'src/lab-prisma/lab-prisma.factory';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';

import { UserCache } from 'src/shared-cache/dto/user-cache.interface';

@Injectable()
export class LabService {
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
    private readonly sharedCacheService: SharedCacheService,
  ) {}

  async selectedLab(uuid: string, labId: number) {
    if (!labId) {
      throw new BadRequestException(
        'El id del laboratorio debe estar definido',
      );
    }
    const lab = await this.systemPrisma.lab.findUnique({
      where: {
        id: Number(labId),
        // Y también debe cumplir esta condición relacional
        users: {
          some: {
            // Busca si "alguno" de los usuarios relacionados
            uuid: uuid, // tiene este uuid.
          },
        },
      },
    });

    console.log(`Laboratorio: ${typeof lab}`);
    if (lab) {
      const labPrisma = await this.labPrismaFactory.createInstanceDB(
        lab.dbName,
      );
      const userLab = await labPrisma.labUser.findUnique({
        where: { systemUserUuid: uuid },
      });
      if (userLab) {
        const permissions = await labPrisma.role.findUnique({
          where: { id: userLab.id },
        });
        if (permissions) {
          this.sharedCacheService.setUser(uuid, labId, permissions);
        }
      }
    } else {
      throw new ForbiddenException(
        'El usuario no tiene acceso al laboratorio indicado',
      );
    }
  }
  async getUserCached(uuid: string): Promise<UserCache | null> {
    return await this.sharedCacheService.getUser(uuid);
  }
}
