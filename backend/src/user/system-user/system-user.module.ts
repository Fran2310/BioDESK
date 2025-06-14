// /src/user/system-user/system-user.module.ts
import { Module } from '@nestjs/common';
import { SystemUserService } from './system-user.service';
import { SystemPrismaModule } from 'src/prisma-manage/system-prisma/system-prisma.module';

@Module({
  imports: [SystemPrismaModule],
  providers: [SystemUserService],
  exports: [SystemUserService],
})
export class SystemUserModule {}
