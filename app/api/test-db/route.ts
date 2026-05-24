import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '../../../lib/db-health';

const CORE_TABLES = ['korisnici', 'ProcenaRizika', 'RiskSelection', 'PrilogM', 'PravnoLice'];

export async function GET() {
    // Disable in production for security
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Endpoint disabled in production' },
            { status: 403 }
        );
    }

    try {
        const health = await getDatabaseHealth({ tableNames: CORE_TABLES });
        
        return NextResponse.json({
            success: true,
            message: 'Azure SQL Database connection successful',
            serverTime: health.serverTime,
            sqlVersion: health.sqlVersion,
            existingTables: health.existingTables,
            connectionInfo: 'Azure SQL Database'
        });
        
    } catch (error) {
        console.error('Database connection test failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Database connection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
