import { forwardRef, Module } from '@nestjs/common';
import { MedicHistoryService } from './medic-history.service';
import { MedicHistoryController } from './medic-history.controller';
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
    forwardRef(() => PatientModule),
    AuditModule,
  ],
  providers: [MedicHistoryService],
  exports: [MedicHistoryService],
  controllers: [MedicHistoryController],
})
export class MedicHistoryModule {}
