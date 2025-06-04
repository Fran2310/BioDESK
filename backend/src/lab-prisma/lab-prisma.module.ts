// src/lab-prisma/lab-prisma.module.ts
import { Module } from '@nestjs/common';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabDbManageService } from './services/lab-db-manage.service';
import { LabPrismaController } from './lab-prisma.controller';
import { RoleDto } from 'src/role/dto/role.dto';

@Module({
  providers: [LabPrismaFactory, LabDbManageService, RoleDto],
  exports: [LabPrismaFactory, LabDbManageService],
  controllers: [LabPrismaController],
})
export class LabPrismaModule {}
