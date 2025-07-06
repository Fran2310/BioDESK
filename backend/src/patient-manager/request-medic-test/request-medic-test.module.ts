import { forwardRef, Module } from '@nestjs/common';
import { RequestMedicTestController } from './request-medic-test.controller';
import { RequestMedicTestService } from './request-medic-test.service';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { PatientModule } from '../patient/patient.module';
import { AuditModule } from 'src/audit/audit.module';
import { MedicHistoryModule } from '../medic-history/medic-history.module';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';
import { LabModule } from 'src/lab/lab.module';
import { LabUserModule } from 'src/user/lab-user/lab-user.module';
import { PdfModule } from 'src/pdf/pdf.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
      SystemUserModule,
      LabUserModule,
      LabPrismaModule,
      LabModule,
      PatientModule,
      MedicHistoryModule,
      AuditModule,
      PdfModule,
      MailModule,
      LabModule,
    ],
  controllers: [RequestMedicTestController],
  providers: [RequestMedicTestService],
  exports: [RequestMedicTestService],
})
export class RequestMedicTestModule {}
