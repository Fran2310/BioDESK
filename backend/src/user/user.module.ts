// /src/user/user.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { LabUserModule } from 'src/user/lab-user/lab-user.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { RoleDto } from 'src/role/dto/role.dto';
import { RoleModule } from 'src/role/role.module';
import { UserController } from './user.controller';
import { SystemUserModule } from './system-user/system-user.module';

@Module({
  imports: [
    SystemPrismaModule,
    LabPrismaModule,
    LabUserModule,
    AuditModule,
    RoleDto,
    SystemUserModule,
    forwardRef(() => LabModule),
    forwardRef(() => RoleModule),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
