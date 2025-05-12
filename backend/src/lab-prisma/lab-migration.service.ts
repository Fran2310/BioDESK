// src/lab-prisma/lab-migration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';

@Injectable()
export class LabMigrationService {
  private readonly logger = new Logger(LabMigrationService.name);

  async migrateDatabase(dbName: string) {
    const schemaPath = './prisma/lab/schema.prisma';
    const dynamicUrl = `${process.env.LAB_DATABASE_BASE_URL}_${dbName}`;

    this.logger.log(`Executing migration for database: ${dbName}`);

    try {
      execSync(
        `DYNAMIC_DATABASE_URL=${dynamicUrl} npx prisma migrate dev --schema=${schemaPath} --name=init_${dbName}`,
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            DYNAMIC_DATABASE_URL: dynamicUrl,
          },
        }
      );
      this.logger.log(`Successfully migrated database: ${dbName}`);
      return true;
    } catch (error) {
      this.logger.error(`Migration failed for database ${dbName}:`, error);
      throw error;
    }
  }

  async createDatabaseIfNotExists(dbName: string) {
    // Primero verifica si la base de datos existe
    // Si no existe, créala y ejecuta las migraciones
    await this.migrateDatabase(dbName);
  }
}