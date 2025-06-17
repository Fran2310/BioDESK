import { Module } from '@nestjs/common';
import { RequestMedicTestController } from './request-medic-test.controller';
import { RequestMedicTestService } from './request-medic-test.service';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { LabModule } from 'src/lab/lab.module';
import { PatientModule } from '../patient/patient.module';
import { AuditModule } from 'src/audit/audit.module';
import { MedicHistoryModule } from '../medic-history/medic-history.module';

@Module({
  imports: [
      LabPrismaModule,
      SystemUserModule,
      LabModule,
      PatientModule,
      MedicHistoryModule,
      AuditModule,
    ],
  controllers: [RequestMedicTestController],
  providers: [RequestMedicTestService]
})
export class RequestMedicTestModule {}
