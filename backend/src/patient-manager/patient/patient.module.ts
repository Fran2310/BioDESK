import { forwardRef, Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { AuditModule } from 'src/audit/audit.module';
import { LabModule } from 'src/lab/lab.module';
import { MedicHistoryModule } from '../medic-history/medic-history.module';

@Module({
  imports: [
      LabPrismaModule,
      SystemUserModule,
      LabModule,
      forwardRef(() => MedicHistoryModule),
      AuditModule,
  ],
  providers: [PatientService],
  exports: [PatientService],
  controllers: [PatientController],
})
export class PatientModule {}
