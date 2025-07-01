import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { StorageModule } from 'src/storage/storage.module';
import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { LabModule } from 'src/lab/lab.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';

@Module({
  imports: [
    LabPrismaModule,
    SystemUserModule,
    LabModule,
    StorageModule,
  ],
  providers: [PdfService],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}
