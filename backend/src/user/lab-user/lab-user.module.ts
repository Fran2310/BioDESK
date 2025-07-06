// /src/user/lab-user/lab-user.module.ts
import { Module } from '@nestjs/common';
import { LabUserService } from './lab-user.service';
import { RoleModule } from 'src/role/role.module';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';

@Module({
  imports: [LabPrismaModule, RoleModule],
  providers: [LabUserService],
  exports: [LabUserService],
})
export class LabUserModule {}
