// /src/user/lab-user/lab-user.module.ts
import { Module } from '@nestjs/common';
import { LabUserService } from './lab-user.service';
import { RoleModule } from 'src/role/role.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';
import { AuditModule } from 'src/audit/audit.module';
import { SystemUserModule } from '../system-user/system-user.module';

@Module({
  imports: [
    LabPrismaModule,
    RoleModule,
    SystemPrismaModule,
    AuditModule,
    SystemUserModule,
  ],
  providers: [LabUserService],
  exports: [LabUserService],
})
export class LabUserModule {}
