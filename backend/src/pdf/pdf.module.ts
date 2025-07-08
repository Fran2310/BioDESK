import { Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { PdfController } from './pdf.controller';
import { StorageModule } from 'src/storage/storage.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { LabModule } from 'src/lab/lab.module';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';
import { DataTestReport } from './services/get-data-test-report.service';

@Module({
  imports: [LabPrismaModule, SystemUserModule, LabModule, StorageModule],
  providers: [PdfService, DataTestReport],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}
