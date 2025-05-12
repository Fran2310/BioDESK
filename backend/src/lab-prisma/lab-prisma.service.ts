// src/lab-prisma/lab-prisma.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-lab';
import { LabMigrationService } from './lab-migration.service';

@Injectable()
export class LabPrismaService extends PrismaClient {
  private readonly logger = new Logger(LabPrismaService.name);
  
  constructor(
    private readonly dbName: string,
    private readonly labMigrationService: LabMigrationService
  ) {
    const dynamicUrl = `${process.env.LAB_DATABASE_BASE_URL}_${dbName}`;
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
      await this.labMigrationService.createDatabaseIfNotExists(this.dbName); // Para iniciar la migración de la base de datos si no existe
      await this.$connect();
      this.logger.log(`Successfully connected to Database ${this.dbName}.`);
    } catch (error) {
      this.logger.error(`Failed to connect to Database ${this.dbName}:`, error.stack);
      throw error; // Relanza el error para que NestJS lo maneje
    }
  }

  async onModuleDestroy() {
    this.logger.log(`Disconnecting from Database ${this.dbName}...`);
    await this.$disconnect();
    this.logger.log(`Disconnected from Database ${this.dbName}.`);
  }
}