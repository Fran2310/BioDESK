import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { RoleDto } from 'src/role/dto/role.dto';

@Module({
  imports: [
    SystemPrismaModule,
    LabPrismaModule,
    AuditModule,
    RoleDto,
    forwardRef(() => LabModule),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
