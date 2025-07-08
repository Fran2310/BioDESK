// /src/user/user.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { LabUserModule } from 'src/user/lab-user/lab-user.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { RoleModule } from 'src/role/role.module';
import { UserController } from './user.controller';
import { SystemUserModule } from './system-user/system-user.module';
import { MailModule } from 'src/mail/mail.module';
import { SystemPrismaModule } from 'src/prisma-manager/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';

@Module({
  imports: [
    LabUserModule,
    SystemUserModule,
    AuditModule,
    LabModule,
    forwardRef(() => RoleModule),
    forwardRef(() => MailModule),
    LabPrismaModule,
    SystemPrismaModule,
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
