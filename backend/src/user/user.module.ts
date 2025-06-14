// /src/user/user.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { LabUserModule } from 'src/user/lab-user/lab-user.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { RoleModule } from 'src/role/role.module';
import { UserController } from './user.controller';
import { SystemUserModule } from './system-user/system-user.module';

@Module({
  imports: [
    LabUserModule,
    SystemUserModule,
    AuditModule,
    LabModule,
    forwardRef(() => RoleModule),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
