import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function GET() {
  try {
    const pool = await getDbConnection();
    // Lagani upit koji održava Azure SQL konekciju i bazu budnom
    await pool.query('SELECT 1 as ping');

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database unreachable' },
      { status: 500 }
    );
  }
}
