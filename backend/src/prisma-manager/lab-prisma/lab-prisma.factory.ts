// src/lab-prisma/lab-prisma.factory.ts
import { Injectable } from '@nestjs/common';
import { LabPrismaService } from './services/lab-prisma.service';

@Injectable()
export class LabPrismaFactory {
  /*
  Método create(dbName) que devuelve una instancia de LabPrismaService.

  Este patrón permite inyectar conexiones dinámicamente sin romper el ciclo de vida de NestJS.

  útil para resolver la carga multi-tenant por request.
  */
  createInstanceDB(dbName: string): LabPrismaService {
    return new LabPrismaService(dbName);
  }
}
