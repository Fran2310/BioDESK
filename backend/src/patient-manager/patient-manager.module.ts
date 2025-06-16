import { Module } from '@nestjs/common';
import { MedicHistoryModule } from './medic-history/medic-history.module';
import { PatientModule } from './patient/patient.module';
import { PatientManagerService } from './patient-manager.service';

@Module({
  imports: [MedicHistoryModule, PatientModule],
  providers: [PatientManagerService]
})
export class PatientManagerModule {}
