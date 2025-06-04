// src/lab-prisma/services/lab-migration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { normalizeDbName } from '../../common/utils/normalize-db-name';
import { generateLabDbUrl } from '../../common/utils/generate-lab-db-url';

/**
 * Servicio para gestionar la migración y creacion de bases de datos de laboratorio.
 * Proporciona métodos para verificar la existencia de una base de datos, crearla si no existe,
 * y ejecutar migraciones Prisma sobre la base de datos especificada.
 * Utiliza conexiones PostgreSQL y registra eventos relevantes mediante el logger interno.
 */
@Injectable()
export class LabDbManageService {
  private readonly logger = new Logger(LabDbManageService.name);

  /**
   * Genera la URL de conexión a la base de datos PostgreSQL para el laboratorio.
   * Utiliza la variable de entorno LAB_DATABASE_BASE_URL y el tipo de base de datos 'postgres'.
   * @returns La URL de conexión a la base de datos.
   */
  private getPgConnectionUrl(): string {
    return generateLabDbUrl(`${process.env.LAB_DATABASE_BASE_URL}`, 'postgres');
  }

  /**
   * Verifica si una base de datos con el nombre especificado ya existe.
   * @param dbName Nombre de la base de datos a verificar.
   * @returns Verdadero si la base de datos existe, falso en caso contrario.
   */
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

  /**
   * Crea una nueva base de datos con el nombre especificado si no existe.
   * @param dbName Nombre de la base de datos a crear.
   * @returns Verdadero si la base de datos fue creada, falso si ya existía.
   */
  async createDatabase(dbName: string): Promise<boolean> {
    dbName = normalizeDbName(dbName);
    const exists = await this.isDatabaseExists(dbName);
    if (exists) {
      this.logger.log(
        `Database "${dbName}" already exists. Skipping creation.`,
      );
      return false;
    }

    const client = new Client({
      connectionString: this.getPgConnectionUrl(),
    });

    try {
      await client.connect();
      this.logger.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      this.logger.log(`Database "${dbName}" created successfully.`);
      return true;
    } catch (error) {
      this.logger.error(`Error creating database "${dbName}":`, error.stack);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Ejecuta las migraciones de Prisma para la base de datos especificada.
   * @param dbName Nombre de la base de datos sobre la que se ejecutarán las migraciones.
   */
  async migrateDatabase(dbName: string): Promise<void> {
    const schemaPath = './prisma/lab/schema.prisma';
    const dynamicUrl = generateLabDbUrl(
      `${process.env.LAB_DATABASE_BASE_URL}`,
      dbName,
    );

    this.logger.log(`Running migration for database "${dbName}"...`);

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
