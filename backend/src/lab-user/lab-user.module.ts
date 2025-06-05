import { Module } from '@nestjs/common';
import { LabUserService } from './lab-user.service';
import { RoleModule } from 'src/role/role.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';

@Module({
  imports: [LabPrismaModule, RoleModule, SystemPrismaModule],
  providers: [LabUserService],
  exports: [LabUserService],
})
export class LabUserModule {}
