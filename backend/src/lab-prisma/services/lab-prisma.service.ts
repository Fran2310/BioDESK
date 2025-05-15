// src/lab-prisma/services/lab-prisma.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-lab';

@Injectable()
export class LabPrismaService extends PrismaClient {
  /*
  Extiende de PrismaClient generado desde lab/schema.prisma.

  Usa una URL dinámica basada en el nombre de la db (LAB_DATABASE_BASE_URL + dbName).

  Se conecta y desconecta automáticamente.

  Este servicio es el cliente por tenant, cargado según el nombre de la DB.
  */
  private readonly logger = new Logger(LabPrismaService.name);

  constructor(private readonly dbName: string) {
    const dynamicUrl = `${process.env.LAB_DATABASE_BASE_URL}${dbName}`;
    console.log(`Database URL: ${dynamicUrl}`);
    super({
      datasources: {
        db: {
          url: dynamicUrl,
        },
      },
      log: ['error', 'warn'],
    });

    this.logger.log(`LabPrismaService initialized for database: ${dbName}`);
    this.logger.debug(`Database URL: ${dynamicUrl}`);
  }

  async onModuleInit() {
    this.logger.log(`Connecting to Database ${this.dbName}...`);
    try {
      await this.$connect();
      this.logger.log(`Successfully connected to Database ${this.dbName}.`);
    } catch (error) {
      this.logger.error(
        `Failed to connect to Database ${this.dbName}:`,
        error.stack,
      );
      throw error; // Relanza el error para que NestJS lo maneje
    }
  }

  async onModuleDestroy() {
    this.logger.log(`Disconnecting from Database ${this.dbName}...`);
    await this.$disconnect();
    this.logger.log(`Disconnected from Database ${this.dbName}.`);
  }
}
