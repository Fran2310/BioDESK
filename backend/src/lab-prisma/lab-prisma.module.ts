// src/lab-prisma/lab-prisma.module.ts
import { Module } from '@nestjs/common';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabMigrationService } from './services/lab-migration.service';
import { LabPrismaController } from './lab-prisma.controller';
import { RoleDto } from 'src/role/dto/role.dto';

@Module({
  providers: [LabPrismaFactory, LabMigrationService, RoleDto],
  exports: [LabPrismaFactory, LabMigrationService],
  controllers: [LabPrismaController],
})
export class LabPrismaModule {}
