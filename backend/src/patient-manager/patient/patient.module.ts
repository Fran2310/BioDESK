import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { AuditModule } from 'src/audit/audit.module';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';

@Module({
  imports: [
    SystemUserModule,
    LabPrismaModule,
    AuditModule,
  ],
  providers: [PatientService],
  exports: [PatientService],
  controllers: [PatientController],
})
export class PatientModule {}
