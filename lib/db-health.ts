import { getDbConnection } from './db';

interface DatabaseHealthOptions {
  includeCounts?: boolean;
  tableNames?: string[];
}

interface TableCountSummary {
  procenaRizika: number;
  prilogM: number;
  riskSelection: number;
}

export interface DatabaseHealth {
  serverTime: Date;
  sqlVersion: string;
  existingTables: string[];
  dataCounts?: TableCountSummary;
}

function toCount(value: unknown): number {
  return parseInt(String(value), 10);
}

export async function getDatabaseHealth(options: DatabaseHealthOptions = {}): Promise<DatabaseHealth> {
  const pool = await getDbConnection();

  const result = await pool.query<{ currentTime: Date; version: string }>(
    'SELECT NOW() as "currentTime", version() as version'
  );

  const tableFilter = options.tableNames?.length
    ? `AND table_name IN (${options.tableNames.map((_, index) => `$${index + 1}`).join(', ')})`
    : '';

  const tablesCheck = await pool.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE' 
      AND table_schema = 'public'
      ${tableFilter}
      ORDER BY table_name
    `, options.tableNames);

  const health: DatabaseHealth = {
    serverTime: result.rows[0].currentTime,
    sqlVersion: result.rows[0].version.split('\n')[0],
    existingTables: tablesCheck.rows.map(row => row.table_name),
  };

  if (options.includeCounts) {
    const [procenaCount, prilogMCount, riskSelectionCount] = await Promise.all([
      pool.query<{ count: number }>('SELECT COUNT(*) as count FROM ProcenaRizika'),
      pool.query<{ count: number }>('SELECT COUNT(*) as count FROM PrilogM'),
      pool.query<{ count: number }>('SELECT COUNT(*) as count FROM RiskSelection'),
    ]);

    health.dataCounts = {
      procenaRizika: toCount(procenaCount.rows[0].count),
      prilogM: toCount(prilogMCount.rows[0].count),
      riskSelection: toCount(riskSelectionCount.rows[0].count),
    };
  }

  return health;
}
