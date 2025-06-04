// src/lab-prisma/lab-prisma.module.ts
import { Module } from '@nestjs/common';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabMigrationService } from './services/lab-migration.service';
import { LabSeedingService } from './services/lab-seeding.service';
import { LabPrismaController } from './lab-prisma.controller';
import { RoleDto } from 'src/role/dto/role.dto';

@Module({
  providers: [
    LabPrismaFactory,
    LabMigrationService,
    LabSeedingService,
    RoleDto,
  ],
  exports: [LabPrismaFactory, LabMigrationService, LabSeedingService],
  controllers: [LabPrismaController],
})
export class LabPrismaModule {}
