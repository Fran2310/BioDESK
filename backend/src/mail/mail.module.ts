import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';

import { SystemUserModule } from 'src/user/system-user/system-user.module';
import { LabModule } from 'src/lab/lab.module';

@Module({
  imports: [SharedCacheModule, SystemUserModule, LabModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
