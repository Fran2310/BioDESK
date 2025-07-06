// src/lab-prisma/services/lab-prisma.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-lab';

import { generateLabDbUrl } from '../../../common/utils/generate-lab-db-url';

/**
 * Servicio Prisma multi-tenant para laboratorios.
 *
 * Extiende PrismaClient usando una URL dinámica basada en el nombre de la base de datos.
 * Se conecta y desconecta automáticamente al ciclo de vida del módulo.
 * Registra eventos importantes y errores usando el logger interno.
 * Este servicio se instancia por tenant según el nombre de la base de datos.
 */
@Injectable()
export class LabPrismaService extends PrismaClient {
  private readonly logger = new Logger(LabPrismaService.name);

  constructor(private readonly dbName: string) {
    const dynamicUrl = generateLabDbUrl(
      `${process.env.LAB_DATABASE_BASE_URL}`,
      dbName,
    );
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

  /**
   * Inicializa el módulo intentando conectar a la base de datos.
   * Registra mensajes de éxito o error en el proceso de conexión.
   * Si ocurre un error, lo relanza para que NestJS lo maneje.
   * @async
   */
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

  /**
   * Maneja la desconexión del cliente de base de datos al destruir el módulo.
   * Registra mensajes antes y después de la desconexión.
   * @async
   */
  async onModuleDestroy() {
    this.logger.log(`Disconnecting from Database ${this.dbName}...`);
    await this.$disconnect();
    this.logger.log(`Disconnected from Database ${this.dbName}.`);
  }
}
