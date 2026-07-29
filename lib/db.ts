import sql from 'mssql';

type GlobalSql = {
  mssqlPool: sql.ConnectionPool | null;
  mssqlPoolPromise: Promise<sql.ConnectionPool> | null;
};

const globalForSql = globalThis as unknown as GlobalSql;

// Azure SQL connection configuration
const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || '',
  user: process.env.AZURE_SQL_USER || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 4,
    min: 1,
    idleTimeoutMillis: 60000,
    acquireTimeoutMillis: 30000,
  },
};

async function connectToAzureSQL(): Promise<sql.ConnectionPool> {
  if (globalForSql.mssqlPool && globalForSql.mssqlPool.connected) {
    return globalForSql.mssqlPool;
  }

  if (globalForSql.mssqlPoolPromise) {
    return globalForSql.mssqlPoolPromise;
  }

  if (!config.server || !config.database || !config.user || !config.password) {
    throw new Error('Azure SQL connection parameters are not set. Check environment variables.');
  }

  try {
    globalForSql.mssqlPoolPromise = sql.connect(config);
    globalForSql.mssqlPool = await globalForSql.mssqlPoolPromise;
    console.log('✅ Connected to Azure SQL Database');

    globalForSql.mssqlPool.on('error', (err: Error) => {
      console.error('Database pool error:', err);
      globalForSql.mssqlPool = null;
      globalForSql.mssqlPoolPromise = null;
    });
  } catch (error) {
    globalForSql.mssqlPoolPromise = null;
    console.error('❌ Failed to connect to Azure SQL:', error);
    throw error;
  }

  return globalForSql.mssqlPool as sql.ConnectionPool;
}

// Helper function to execute queries with automatic parameter conversion
export async function executeQuery<T = Record<string, unknown>>(
  query: string,
  params?: unknown[]
): Promise<sql.IResult<T>> {
  const pool = await connectToAzureSQL();
  const request = pool.request();

  // Convert PostgreSQL-style $1, $2 parameters to @param1, @param2
  let azureQuery = query;
  if (params && params.length > 0) {
    params.forEach((param, index) => {
      const paramName = `param${index + 1}`;
      // Replace $1, $2, etc. with @param1, @param2, etc.
      azureQuery = azureQuery.replace(
        new RegExp(`\\$${index + 1}\\b`, 'g'),
        `@${paramName}`
      );

      // Add parameter to request
      request.input(paramName, param);
    });
  }

  return await request.query(azureQuery);
}

// Compatibility layer for PostgreSQL-style pool.query()
export class QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;

  constructor(result: sql.IResult<T>) {
    this.rows = result.recordset || [];
    this.rowCount = result.rowsAffected[0] || 0;
  }
}

// Main export - returns a pool-like object with query method for backward compatibility
export async function getDbConnection() {
  await connectToAzureSQL();

  return {
    query: async <T = Record<string, unknown>>(queryText: string, params?: unknown[]): Promise<QueryResult<T>> => {
      const result = await executeQuery<T>(queryText, params);
      return new QueryResult<T>(result);
    },
  };
}

// Kreiranje tabele korisnika sa statusom i automatski admin ako ne postoji
export async function createUsersTable() {
  const pool = await getDbConnection();

  // Kreiranje tabele korisnika
  await pool.query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='korisnici' AND xtype='U')
    CREATE TABLE korisnici (
      id INT IDENTITY(1,1) PRIMARY KEY,
      email NVARCHAR(255) UNIQUE NOT NULL,
      lozinka NVARCHAR(255) NOT NULL,
      ime NVARCHAR(100) NOT NULL,
      prezime NVARCHAR(100) NOT NULL,
      status NVARCHAR(20) DEFAULT 'na_cekanju' NOT NULL,
      je_admin BIT DEFAULT 0,
      datum_kreiranja DATETIME2 DEFAULT GETDATE(),
      datum_odobrenja DATETIME2 NULL,
      odobrio_admin INT NULL
    )
  `);

  // Proverava da li postoji admin
  const adminExists = await pool.query<{count: number}>(`
    SELECT COUNT(*) as count FROM korisnici WHERE je_admin = 1
  `);

  if (parseInt(String(adminExists.rows[0].count)) === 0) {
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO korisnici (email, lozinka, ime, prezime, status, je_admin)
      VALUES (@param1, @param2, @param3, @param4, @param5, @param6)
    `, ['admin@admin.com', adminPassword, 'Admin', 'Administrator', 'odobren', true]);
  }
}

// Kreiranje kompletne šeme baze podataka - briše postojeće podatke!
export async function initializeDatabase() {
  const connection = await connectToAzureSQL();

  try {
    console.log('🗑️ Dropping existing schema...');

    // Drop all foreign key constraints
    await connection.request().query(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + 
                     QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                     ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
      FROM sys.foreign_keys;
      EXEC sp_executesql @sql;
    `);

    // Drop all tables
    await connection.request().query(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql += 'DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ';'
      FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
      EXEC sp_executesql @sql;
    `);

    console.log('🏗️ Creating fresh database schema...');

    // Read and execute the schema file
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.join(process.cwd(), 'azure_schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema.split('GO').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          await connection.request().query(statement);
        }
      }
    } else {
      throw new Error('Schema file not found: azure_schema.sql');
    }

    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.request()
      .input('email', sql.NVarChar, 'admin@admin.com')
      .input('lozinka', sql.NVarChar, adminPassword)
      .input('ime', sql.NVarChar, 'Admin')
      .input('prezime', sql.NVarChar, 'Administrator')
      .input('status', sql.NVarChar, 'odobren')
      .input('je_admin', sql.Bit, true)
      .query(`
        INSERT INTO korisnici (email, lozinka, ime, prezime, status, je_admin)
        VALUES (@email, @lozinka, @ime, @prezime, @status, @je_admin)
      `);

    console.log('✅ Database schema initialized successfully');
    console.log('👤 Default admin created: admin@admin.com / admin123');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Kreiranje tabela za procenu rizika (backward compatibility)
export async function createRiskAssessmentTables() {
  return initializeDatabase();
}

// Close the connection pool
export async function closeConnection() {
  if (globalForSql.mssqlPool) {
    await globalForSql.mssqlPool.close();
    globalForSql.mssqlPool = null;
    globalForSql.mssqlPoolPromise = null;
    console.log('Database connection closed');
  }
}
