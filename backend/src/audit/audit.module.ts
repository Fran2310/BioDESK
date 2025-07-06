// src/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/prisma-manager/system-prisma/system-prisma.module';
import { AuditController } from './audit.controller';
import { SystemUserModule } from 'src/user/system-user/system-user.module';

@Module({
  imports: [LabPrismaModule, SystemPrismaModule, SystemUserModule],
  providers: [AuditService],
  exports: [AuditService],
  controllers: [AuditController],
})
export class AuditModule {}
