import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
      SystemPrismaModule,
      LabPrismaModule,
      SystemUserModule,
      AuditModule,
  ],
  providers: [PatientService],
  controllers: [PatientController]
})
export class PatientModule {}
