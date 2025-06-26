import { Module } from '@nestjs/common';
import { RequestMedicTestController } from './request-medic-test.controller';
import { RequestMedicTestService } from './request-medic-test.service';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { PatientModule } from '../patient/patient.module';
import { AuditModule } from 'src/audit/audit.module';
import { MedicHistoryModule } from '../medic-history/medic-history.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { LabModule } from 'src/lab/lab.module';

@Module({
  imports: [
      SystemUserModule,
      LabPrismaModule,
      LabModule,
      PatientModule,
      MedicHistoryModule,
      AuditModule,
    ],
  controllers: [RequestMedicTestController],
  providers: [RequestMedicTestService],
  exports: [RequestMedicTestService],
})
export class RequestMedicTestModule {}
