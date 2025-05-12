// src/lab-prisma/lab-prisma.factory.ts
import { Injectable } from '@nestjs/common';
import { LabPrismaService } from './lab-prisma.service';
import { LabMigrationService } from './lab-migration.service';

@Injectable()
export class LabPrismaFactory {
  create(dbName: string): LabPrismaService {
    return new LabPrismaService(dbName, new LabMigrationService);
  }
}