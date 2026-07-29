import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../lib/db';

export async function POST() {
    try {
        const pool = await getDbConnection();
        
        // Simple insert without foreign key constraints
        await pool.query(`
            INSERT INTO ProcenaRizika (naziv, opis, status, createdAt, updatedAt)
            VALUES ($1, $2, $3, GETDATE(), GETDATE())
        `, ['Test Procena Rizika', 'Test opis', 'u_toku']);

        const result = await pool.query('SELECT CAST(SCOPE_IDENTITY() as INT) as id');
        const procenaId = result.rows[0].id;
        
        return NextResponse.json({
            success: true,
            message: 'Simple test risk assessment created',
            procenaId: procenaId,
            testUrl: `/optimized-risk/${procenaId}`
        });
        
    } catch (error) {
        console.error('Error creating simple test:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
