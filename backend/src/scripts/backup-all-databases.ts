import 'dotenv/config'
import { Client } from 'pg'
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// === CONFIGURACIÓN ===
const DUMP_DIR = process.env.DUMP_OUTPUT_DIR || './db_dumps'
const EXCLUDED_DATABASES = ['postgres', 'template0', 'template1', 'system_db']
const SUPABASE_BUCKET = 'db-dumps'

// === Supabase ===
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('❌ Supabase credentials missing in .env')

const supabase = createClient(supabaseUrl, supabaseKey)

// === Asegura que la carpeta local de dumps exista ===
async function ensureDumpFolderExists() {
  try {
    await fs.mkdir(DUMP_DIR, { recursive: true })
  } catch (err) {
    console.error('❌ Error creando carpeta de dumps:', err.message)
  }
}

// === Construye una nueva URL de conexión con nombre de base distinto ===
function buildDatabaseUrl(originalUrl, newDbName) {
  const url = new URL(originalUrl)
  const pathParts = url.pathname.split('/').filter(Boolean)
  pathParts[pathParts.length - 1] = newDbName
  url.pathname = '/' + pathParts.join('/')
  return url.toString()
}

// === Función principal ===
async function backupAndUploadAllDatabases() {
  const sourceUrl = process.env.SYSTEM_DATABASE_URL
  if (!sourceUrl) throw new Error('❌ Falta SYSTEM_DATABASE_URL en .env')

  await ensureDumpFolderExists()

  const adminUrl = buildDatabaseUrl(sourceUrl, 'postgres')
  const client = new Client({ connectionString: adminUrl })

  try {
    await client.connect()

    const { rows } = await client.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      AND datname NOT IN (${EXCLUDED_DATABASES.map((db) => `'${db}'`).join(', ')})
    `)

    for (const { datname: dbName } of rows) {
      console.log(`\n📦 Respaldando: ${dbName}`)

      const dbUrl = buildDatabaseUrl(sourceUrl, dbName)
      const dumpFile = path.join(DUMP_DIR, `${dbName}.sql`)

      try {
        // 1. Crear dump local
        execSync(
          `pg_dump --clean --if-exists --no-owner --no-privileges --dbname="${dbUrl}" -f "${dumpFile}"`,
          { stdio: 'inherit' }
        )
        console.log(`✅ Dump local creado: ${dumpFile}`)

        // 2. Leer archivo como buffer
        const buffer = await fs.readFile(dumpFile)

        // 3. Subir a Supabase bucket privado
        const remotePath = `${dbName}.sql`
        const { error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(remotePath, buffer, {
            contentType: 'application/sql',
            upsert: true,
          })

        if (error) {
          throw new Error(`❌ Fallo al subir ${remotePath} a Supabase: ${error.message}`)
        }

        console.log(`📤 Subido a Supabase como: ${SUPABASE_BUCKET}/${remotePath}`)

        // 4. (opcional) Eliminar dump local
        await fs.unlink(dumpFile)
      } catch (err) {
        console.error(`❌ Error con ${dbName}:`, err.message)
      }
    }
  } catch (err) {
    console.error('❌ Error general:', err.message)
  } finally {
    await client.end()
  }
}

backupAndUploadAllDatabases()
