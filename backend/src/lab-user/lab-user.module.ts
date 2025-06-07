import { Module } from '@nestjs/common';
import { LabUserService } from './lab-user.service';
import { RoleModule } from 'src/role/role.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { AuditModule } from 'src/audit/audit.module';
import { LabUserController } from './lab-user.controller';

@Module({
  imports: [LabPrismaModule, RoleModule, SystemPrismaModule, AuditModule],
  providers: [LabUserService],
  exports: [LabUserService],
  controllers: [LabUserController],
})
export class LabUserModule {}
