import { forwardRef, Module } from '@nestjs/common';
import { LabService } from './services/lab.service';
import { LabController } from './lab.controller';
import { AuditModule } from 'src/audit/audit.module';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';
import { UserModule } from 'src/user/user.module';
import { ManageLogoLabService } from './services/manage-logo-lab.service';

@Module({
  imports: [
    SystemPrismaModule,
    LabPrismaModule,
    SharedCacheModule,
    AuditModule,
    forwardRef(() => UserModule), // UserModule se importa de forma diferida para evitar dependencias circulares
  ],
  providers: [LabService, ManageLogoLabService],
  controllers: [LabController],
  exports: [LabService, ManageLogoLabService],
})
export class LabModule {}
