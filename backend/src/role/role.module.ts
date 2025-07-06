// /src/role/role.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/prisma-manager/system-prisma/system-prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuditModule } from 'src/audit/audit.module';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';

@Module({
  imports: [
    SharedCacheModule,
    AuditModule,
    LabPrismaModule,
    SystemPrismaModule,
    forwardRef(() => UserModule),
  ],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
