import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SystemPrismaModule } from 'src/system-prisma/system-prisma.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';
import { LabController } from './lab.controller';

@Module({
  imports: [SystemPrismaModule, LabPrismaModule],
  controllers: [LabController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
