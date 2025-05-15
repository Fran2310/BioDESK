// src/system-prisma/system-prisma.controller.ts
import { Module } from '@nestjs/common';
import { SystemPrismaService } from './system-prisma.service';
import { SystemPrismaController } from './system-prisma.controller';

@Module({
  providers: [SystemPrismaService],
  exports: [SystemPrismaService],
  controllers: [SystemPrismaController], // Exporta el servicio para que otros módulos lo inyecten
})
export class SystemPrismaModule {}
