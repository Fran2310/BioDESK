import { Module } from '@nestjs/common';
import { PatientHistoryModule } from './patient-history/patient-history.module';
import { PatientModule } from './patient/patient.module';
import { PatientManagerService } from './patient-manager.service';

@Module({
  imports: [PatientHistoryModule, PatientModule],
  providers: [PatientManagerService]
})
export class PatientManagerModule {}
