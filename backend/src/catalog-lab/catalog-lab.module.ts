import { Module } from '@nestjs/common';
import { CatalogLabService } from './catalog-lab.service';
import { CatalogLabController } from './catalog-lab.controller';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';

@Module({
  imports: [LabPrismaModule],
  providers: [CatalogLabService],
  controllers: [CatalogLabController],
})
export class CatalogLabModule {}
