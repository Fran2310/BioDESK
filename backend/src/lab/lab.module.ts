import { Module } from '@nestjs/common';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';

import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';

@Module({
  imports: [
      SystemPrismaModule,
      LabPrismaModule,
      SharedCacheModule,
    ],
  providers: [LabService],
  controllers: [LabController],
  exports: [LabService],
})
export class LabModule {}
