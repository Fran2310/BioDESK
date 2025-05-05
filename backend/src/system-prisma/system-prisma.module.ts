import { Module } from '@nestjs/common';
import { SystemPrismaService } from './system-prisma.service';

@Module({
  providers: [SystemPrismaService],
  exports: [SystemPrismaService], // Exporta el servicio para que otros módulos lo inyecten
})
export class SystemPrismaModule {}