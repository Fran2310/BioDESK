// src/system-prisma/system-prisma.controller.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client-system';

@Injectable()
/*
  Es un PrismaClient especializado con la URL definida por SYSTEM_DATABASE_URL.

  Se encarga de conectarse/desconectarse correctamente durante el ciclo de vida de la app.

  Es el único punto de conexión con la base de datos "core" del sistema.
*/
export class SystemPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SystemPrismaService.name);

  constructor() {
    // Asegúrate de que las variables de entorno estén cargadas antes de esto
    const systemDatabaseUrl = process.env.SYSTEM_DATABASE_URL;
    if (!systemDatabaseUrl) {
      throw new Error('SYSTEM_DATABASE_URL environment variable is not set.');
    }

    // Llama al constructor de PrismaClient
    super({
      datasources: {
        db: {
          // 'db' debe coincidir con el nombre de la datasource en tu schema.prisma
          url: systemDatabaseUrl, // Aquí pasas la URL de la variable de entorno
        },
      },
      log: ['query', 'error', 'warn'], // Opcional: habilita logging para ver las queries
    });

    this.logger.log(
      `SystemPrismaService initialized with URL: ${systemDatabaseUrl}`,
    );
  }

  async onModuleInit() {
    this.logger.log('Connecting to System Database...');
    try {
      await this.$connect();
      this.logger.log('Successfully connected to System Database.');
    } catch (error) {
      this.logger.error('Failed to connect to System Database:', error.stack);
      throw error; // Relanza el error para que NestJS lo maneje
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from System Database...');
    await this.$disconnect();
    this.logger.log('Disconnected from System Database.');
  }
}
