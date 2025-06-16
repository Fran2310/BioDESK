import { Module } from '@nestjs/common';
import { CatalogLabService } from './services/catalog-lab.service';
import { CatalogLabController } from './controllers/catalog-lab.controller';
import { LabPrismaModule } from 'src/prisma-manage/lab-prisma/lab-prisma.module';
import { AuditModule } from 'src/audit/audit.module';
import { PropertyService } from './services/property.service';
import { ValueReferenceService } from './services/value-reference.service';
import { ValueRefController } from './controllers/value-ref.controller';
import { MedicTestPropertyController } from './controllers/property.controller';

@Module({
  imports: [LabPrismaModule, AuditModule],
  providers: [CatalogLabService, PropertyService, ValueReferenceService],
  controllers: [
    CatalogLabController,
    ValueRefController,
    MedicTestPropertyController,
  ],
})
export class CatalogLabModule {}
