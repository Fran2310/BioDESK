// src/lab-prisma/lab-prisma.module.ts
import { Module } from '@nestjs/common';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabMigrationService } from './lab-migration.service';

@Module({
  providers: [LabPrismaFactory, LabMigrationService],
  exports: [LabPrismaFactory, LabMigrationService],
})
export class LabPrismaModule {}