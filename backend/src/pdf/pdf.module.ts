import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { StorageModule } from 'src/storage/storage.module';
import { RequestMedicTestModule } from 'src/patient-manager/request-medic-test/request-medic-test.module';

@Module({
  imports: [
    RequestMedicTestModule,
    StorageModule,
  ],
  providers: [PdfService],
  controllers: [PdfController]
})
export class PdfModule {}
