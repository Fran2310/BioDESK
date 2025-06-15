import { Module } from '@nestjs/common';
import { PatientHistoryModule } from './patient-history/patient-history.module';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [PatientHistoryModule, PatientModule]
})
export class PatientManagerModule {}
