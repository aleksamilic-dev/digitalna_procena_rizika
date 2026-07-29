import fs from 'fs';
import path from 'path';

// Load .env and .env.local manually
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

for (const p of [envPath, envLocalPath]) {
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

async function main() {
  const { getDbConnection } = await import('../lib/db');
  console.log('Connecting to DB...');
  console.log('Server:', process.env.AZURE_SQL_SERVER);
  console.log('Database:', process.env.AZURE_SQL_DATABASE);
  
  const pool = await getDbConnection();
  
  console.log('\n--- PravnoLice Columns ---');
  const columns = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'PravnoLice'
  `);
  console.log(columns.rows);

  console.log('\n--- PravnoLice Data ---');
  const pravnaLica = await pool.query(`SELECT * FROM PravnoLice`);
  console.log(JSON.stringify(pravnaLica.rows, null, 2));

  console.log('\n--- OrganizacijaProceneRizika Data ---');
  const orgData = await pool.query(`SELECT * FROM OrganizacijaProceneRizika`);
  console.log(JSON.stringify(orgData.rows, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
