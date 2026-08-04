import { NextRequest, NextResponse } from 'next/server';
import { ProcenaRouteContext } from '../../../types';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const { getDbConnection } = await import('../../../../../lib/db');
        const pool = await getDbConnection();

        const result = await pool.query(`
            SELECT * FROM prilog_s 
            WHERE procena_id = $1
            ORDER BY group_id, item_id
        `, [procenaId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Greška pri dohvatanju Prilog S podataka:', error);
        return NextResponse.json({ error: 'Greška pri dohvatanju podataka' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const { groupId, itemId, vrednost } = await request.json();
        const { getDbConnection } = await import('../../../../../lib/db');
        const pool = await getDbConnection();

        // Proveri da li već postoji zapis
        const existingResult = await pool.query(`
            SELECT id FROM prilog_s 
            WHERE procena_id = $1 AND group_id = $2 AND item_id = $3
        `, [procenaId, groupId, itemId]);

        if (existingResult.rows.length > 0) {
            // Ažuriraj postojeći zapis
            await pool.query(`
                UPDATE prilog_s 
                SET vrednost = $1, updated_at = NOW()
                WHERE procena_id = $2 AND group_id = $3 AND item_id = $4
            `, [vrednost, procenaId, groupId, itemId]);
        } else {
            // Kreiraj novi zapis
            await pool.query(`
                INSERT INTO prilog_s (procena_id, group_id, item_id, vrednost, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [procenaId, groupId, itemId, vrednost]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Greška pri čuvanju Prilog S podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}