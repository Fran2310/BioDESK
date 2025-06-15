import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';

@Module({
  imports: [
      SystemPrismaModule,
      LabPrismaModule,
  ],
  providers: [PatientService],
  controllers: [PatientController]
})
export class PatientModule {}
