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
    const baseUrlWithQuery: string = `${process.env.LAB_DATABASE_BASE_URL}`;
    // 1. Crea un objeto URL a partir de la cadena completa.
    // El constructor analizará automáticamente la ruta, el host, los parámetros, etc.
    const url = new URL(baseUrlWithQuery);
    // 2. Modifica el 'pathname' para añadir el nombre de la base de datos.
    // Es importante asegurarse de que la unión se haga correctamente.
    // Usar `path.join` o una lógica similar es más seguro.
    // Aquí, una forma simple es asegurar que no haya dobles barras (//).
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${dbName}`;
    // 3. Convierte el objeto URL modificado de nuevo a una cadena de texto.
    // Los parámetros de consulta originales se conservarán automáticamente.
    const dynamicUrl = url.toString();
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
