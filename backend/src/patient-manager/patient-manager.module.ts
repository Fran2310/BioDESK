import { Module } from '@nestjs/common';
import { MedicHistoryModule } from './medic-history/medic-history.module';
import { PatientModule } from './patient/patient.module';
import { PatientManagerService } from './patient-manager.service';
import { RequestMedicTestModule } from './request-medic-test/request-medic-test.module';

@Module({
  imports: [MedicHistoryModule, PatientModule, RequestMedicTestModule],
  providers: [PatientManagerService]
})
export class PatientManagerModule {}
