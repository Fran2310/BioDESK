// src/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';

@Module({
  imports: [LabPrismaModule, SystemPrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
