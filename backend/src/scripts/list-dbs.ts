import 'dotenv/config'; // Carga .env
import { Client } from 'pg';

const connectionString = process.env.SYSTEM_DATABASE_URL;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  const query = `
        SELECT datname FROM pg_database
        WHERE datistemplate = false
        AND datname NOT IN ('postgres', 'template0', 'template1', 'system_db')
      `;
  const res = await client.query(query);
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);