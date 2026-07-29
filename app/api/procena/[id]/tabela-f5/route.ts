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
            SELECT * FROM tabela_f5 
            WHERE procena_id = $1
            ORDER BY item_id
        `, [procenaId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Greška pri dohvatanju Tabela F.5 podataka:', error);
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
        const { itemId, field, value } = await request.json();
        const { getDbConnection } = await import('../../../../../lib/db');
        const pool = await getDbConnection();

        // Proveri da li već postoji zapis
        const existingResult = await pool.query(`
            SELECT id FROM tabela_f5 
            WHERE procena_id = $1 AND item_id = $2
        `, [procenaId, itemId]);

        if (existingResult.rows.length > 0) {
            // Ažuriraj postojeći zapis
            if (field === 'mera') {
                await pool.query(`
                    UPDATE tabela_f5 
                    SET mera = $1, updated_at = GETDATE()
                    WHERE procena_id = $2 AND item_id = $3
                `, [value, procenaId, itemId]);
            } else {
                await pool.query(`
                    UPDATE tabela_f5 
                    SET opis_i_obrazlozenje = $1, updated_at = GETDATE()
                    WHERE procena_id = $2 AND item_id = $3
                `, [value, procenaId, itemId]);
            }
        } else {
            // Kreiraj novi zapis
            const meraValue = field === 'mera' ? value : '';
            const opisValue = field === 'opisIObrazlozenje' ? value : '';

            await pool.query(`
                INSERT INTO tabela_f5 (procena_id, item_id, mera, opis_i_obrazlozenje, created_at, updated_at)
                VALUES ($1, $2, $3, $4, GETDATE(), GETDATE())
            `, [procenaId, itemId, meraValue, opisValue]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Greška pri čuvanju Tabela F.5 podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}