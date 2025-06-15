import { Module } from '@nestjs/common';
import { PatientHistoryService } from './patient-history.service';
import { PatientHistoryController } from './patient-history.controller';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { LabModule } from 'src/lab/lab.module';
import { AuditModule } from 'src/audit/audit.module';
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [
    LabPrismaModule,
    SystemUserModule,
    LabModule,
    PatientModule,
    AuditModule,
  ],
  providers: [PatientHistoryService],
  exports: [PatientHistoryService],
  controllers: [PatientHistoryController],
})
export class PatientHistoryModule {}
