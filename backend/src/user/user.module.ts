// /src/user/user.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { LabUserModule } from 'src/lab-user/lab-user.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { RoleDto } from 'src/role/dto/role.dto';
import { RoleModule } from 'src/role/role.module';
import { UserController } from './user.controller';

@Module({
  imports: [
    SystemPrismaModule,
    LabPrismaModule,
    LabUserModule,
    AuditModule,
    RoleDto,
    forwardRef(() => LabModule),
    forwardRef(() => RoleModule),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
