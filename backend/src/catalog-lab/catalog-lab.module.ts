import { Module } from '@nestjs/common';
import { CatalogLabService } from './catalog-lab.service';
import { CatalogLabController } from './catalog-lab.controller';

@Module({
  providers: [CatalogLabService],
  controllers: [CatalogLabController]
})
export class CatalogLabModule {}
