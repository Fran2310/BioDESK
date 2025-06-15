import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';
import { UserModule } from 'src/user/user.module';


@Module({
  imports: [
    SharedCacheModule,
    UserModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}