import 'dotenv/config';
import { Client } from 'pg';
import { execSync } from 'child_process';

// Función para construir la nueva URL con el nombre de DB y parámetros preservados
function buildDatabaseUrl(originalUrl: string, newDbName: string): string {
  const url = new URL(originalUrl);
  
  // Reemplaza el nombre de la DB (ej: /system_db -> /nueva_db)
  const pathParts = url.pathname.split('/').filter(Boolean);
  pathParts[pathParts.length - 1] = newDbName; // Reemplaza el último segmento
  url.pathname = '/' + pathParts.join('/');

  return url.toString();
}

async function migrateAllDatabases() {
  const originalUrl = process.env.SYSTEM_DATABASE_URL;
  if (!originalUrl) throw new Error('SYSTEM_DATABASE_URL no definida en .env');

  // Conexión a la DB "postgres" para listar las demás (usando URL base sin parámetros)
  const adminUrl = buildDatabaseUrl(originalUrl, 'postgres');
  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();

    try {
      // Ejecutar rollback para el sistem Prisma
      execSync(`npx prisma migrate resolve --rolled-back "20250622082432_fix_medicHistory_type" --schema=./prisma/system/schema.prisma`);
      console.log(`✅ system_db rollback exitoso`);
    } catch (error) {
      console.error(`❌ Error en system_db:`, error.message);
    }

    // 1. Obtener lista de DBs
    const { rows } = await client.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      AND datname NOT IN ('postgres', 'template0', 'template1', 'system_db')
    `);

    // 2. Migrar cada DB
    for (const { datname: dbName } of rows) {
      console.log(`\n🔁 Rollback en ${dbName}...`);
      
      const dbUrl = buildDatabaseUrl(originalUrl, dbName);
      
      try {
        // Ejecutar rollback con Prisma CLI
        execSync(`npx prisma migrate resolve --rolled-back "20250622082432_fix_medicHistory_type" --schema=./prisma/lab/schema.prisma`, {
          env: {
            ...process.env,
            DYNAMIC_DATABASE_URL: dbUrl, // Sobrescribe la URL
          },
          stdio: 'inherit',
        });
        console.log(`✅ ${dbName} rollback exitoso`);
      } catch (error) {
        console.error(`❌ Error en ${dbName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await client.end();
  }
}

migrateAllDatabases();