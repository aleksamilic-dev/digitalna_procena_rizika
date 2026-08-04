import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

// Global pool caching for Next.js (prevents new pool on every hot-reload)
type GlobalPg = {
  pgPool: Pool | null;
};
const globalForPg = globalThis as unknown as GlobalPg;

const DEFAULT_DATABASE_URL = 'postgresql://neondb_owner:npg_xa7Mue6cQENB@ep-aged-bird-asnradwd.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require';

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

function getPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = createPool();
    globalForPg.pgPool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
      globalForPg.pgPool = null;
    });
    console.log('✅ Connected to Neon PostgreSQL');
  }
  return globalForPg.pgPool;
}

// Main export - returns a pool-like object compatible with existing code
export async function getDbConnection() {
  const pool = getPool();
  return {
    query: async <T = Record<string, unknown>>(
      queryText: string,
      params?: unknown[]
    ): Promise<{ rows: T[]; rowCount: number }> => {
      const result = await pool.query(queryText, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount ?? 0,
      };
    },
  };
}

// Expose pool directly for transactions
export function getRawPool(): Pool {
  return getPool();
}

export async function closeConnection() {
  if (globalForPg.pgPool) {
    await globalForPg.pgPool.end();
    globalForPg.pgPool = null;
    console.log('PostgreSQL pool closed');
  }
}

// Legacy helpers — kept for backward compatibility
export async function createUsersTable() {
  const pool = await getDbConnection();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS korisnici (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      lozinka VARCHAR(255) NOT NULL,
      ime VARCHAR(100) NOT NULL,
      prezime VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'na_cekanju' NOT NULL,
      je_admin BOOLEAN DEFAULT FALSE,
      datum_kreiranja TIMESTAMP DEFAULT NOW(),
      datum_odobrenja TIMESTAMP NULL,
      odobrio_admin INT NULL
    )
  `);

  const adminExists = await pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM korisnici WHERE je_admin = TRUE`);
  if (parseInt(adminExists.rows[0].count) === 0) {
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO korisnici (email, lozinka, ime, prezime, status, je_admin) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin@admin.com', adminPassword, 'Admin', 'Administrator', 'odobren', true]
    );
  }
}

export async function createRiskAssessmentTables() {
  return initializeDatabase();
}

export async function initializeDatabase() {
  const pool = await getDbConnection();
  console.log('🏗️ Initializing database schema...');

  // Run the full schema
  const fs = await import('fs');
  const path = await import('path');
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Schema initialized from schema.sql');
  } else {
    throw new Error('schema.sql not found');
  }
}
