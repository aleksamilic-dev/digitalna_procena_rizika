import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '../../../lib/db-health';

export async function GET() {
    try {
        const health = await getDatabaseHealth({ includeCounts: true });
        
        return NextResponse.json({
            success: true,
            message: 'Azure SQL Database connection successful',
            serverTime: health.serverTime,
            sqlVersion: health.sqlVersion,
            existingTables: health.existingTables,
            dataCounts: health.dataCounts,
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
