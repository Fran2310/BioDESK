import { Module } from '@nestjs/common';
import { CatalogLabService } from './services/catalog-lab.service';
import { CatalogLabController } from './controllers/catalog-lab.controller';
import { LabPrismaModule } from 'src/prisma-manager/lab-prisma/lab-prisma.module';
import { AuditModule } from 'src/audit/audit.module';

/**
 * NOTICE: No se incluyen los servicios y controladores de property y value-ref porque estan deprecados, fueron reemplazados por el general de catalog-lab
 */
@Module({
  imports: [LabPrismaModule, AuditModule],
  providers: [CatalogLabService],
  controllers: [CatalogLabController],
})
export class CatalogLabModule {}
