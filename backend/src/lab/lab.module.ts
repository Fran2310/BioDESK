import { forwardRef, Module } from '@nestjs/common';
import { LabService } from './services/lab.service';
import { LabController } from './lab.controller';

import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';
import { UserModule } from 'src/user/user.module';
import { ManageLogoLabService } from './services/manage-logo-lab.service';

@Module({
  imports: [
    SystemPrismaModule,
    LabPrismaModule,
    SharedCacheModule,
    forwardRef(() => UserModule),
  ],
  providers: [LabService, ManageLogoLabService],
  controllers: [LabController],
  exports: [LabService, ManageLogoLabService],
})
export class LabModule {}
