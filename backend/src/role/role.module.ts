// /src/role/role.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
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
