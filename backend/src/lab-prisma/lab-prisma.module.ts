// src/lab-prisma/lab-prisma.module.ts
import { Module } from '@nestjs/common';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabMigrationService } from './services/lab-migration.service';
import { LabPrismaController } from './lab-prisma.controller';

@Module({
  providers: [LabPrismaFactory, LabMigrationService],
  exports: [LabPrismaFactory, LabMigrationService],
  controllers: [LabPrismaController],
})
export class LabPrismaModule {}
