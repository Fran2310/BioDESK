// src/lab-prisma/services/lab-migration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class LabMigrationService {
  private readonly logger = new Logger(LabMigrationService.name);

  private getPgConnectionUrl(): string {
    // Conexión base (a postgres o system_db)
    return process.env.LAB_DATABASE_BASE_URL + 'postgres';
  }

  async isDatabaseExists(dbName: string): Promise<boolean> {
    const client = new Client({
      connectionString: this.getPgConnectionUrl(),
    });

    try {
      await client.connect();
      const result = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );
      this.logger.log(result);
      return result.rowCount > 0;
    } catch (error) {
      this.logger.error(
        `Error checking existence of DB "${dbName}":`,
        error.stack,
      );
      throw error;
    } finally {
      await client.end();
    }
  }

  async createDatabase(dbName: string): Promise<boolean> {
    const exists = await this.isDatabaseExists(dbName);
    if (exists) {
      this.logger.log(
        `ℹ️ Database "${dbName}" already exists. Skipping creation.`,
      );
      return false;
    }

    const client = new Client({
      connectionString: this.getPgConnectionUrl(),
    });

    try {
      await client.connect();
      this.logger.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE "lab_${dbName}"`);
      this.logger.log(`Database "${dbName}" created successfully.`);
      return true;
    } catch (error) {
      this.logger.error(`Error creating database "${dbName}":`, error.stack);
      throw error;
    } finally {
      await client.end();
    }
  }

  async migrateDatabase(dbName: string): Promise<void> {
    const schemaPath = './prisma/lab/schema.prisma';
    const dynamicUrl = `${process.env.LAB_DATABASE_BASE_URL}_${dbName}`;

    this.logger.log(`🔄 Running migration for database "${dbName}"...`);

    try {
      const { execSync } = await import('child_process');
      execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          DYNAMIC_DATABASE_URL: dynamicUrl,
        },
      });
      this.logger.log(`Migration completed for "${dbName}".`);
    } catch (error) {
      this.logger.error(`Migration failed for "${dbName}":`, error);
      throw error;
    }
  }
}
