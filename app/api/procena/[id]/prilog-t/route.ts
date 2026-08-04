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
            SELECT * FROM prilog_t 
            WHERE procena_id = $1
        `, [procenaId]);

        return NextResponse.json(result.rows[0] || {});
    } catch (error) {
        console.error('Greška pri dohvatanju Prilog T podataka:', error);
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
        const {
            kapital_score,
            menadzeri_score,
            osiguranje_score,
            registar_score,
            zarada_score
        } = await request.json();

        const { getDbConnection } = await import('../../../../../lib/db');
        const pool = await getDbConnection();

        // Calculate Average
        const validScores = [
            kapital_score,
            menadzeri_score,
            osiguranje_score,
            registar_score,
            zarada_score
        ].filter(s => s !== null && s !== undefined);

        let prosek_resursa = null;
        if (validScores.length === 5) {
            const sum = validScores.reduce((a, b) => a + b, 0);
            prosek_resursa = parseFloat((sum / 5).toFixed(2));
        }

        // Proveri da li već postoji zapis
        const existingResult = await pool.query(`
            SELECT id FROM prilog_t 
            WHERE procena_id = $1
        `, [procenaId]);

        if (existingResult.rows.length > 0) {
            // Ažuriraj postojeći zapis
            await pool.query(`
                UPDATE prilog_t 
                SET kapital_score = $1, menadzeri_score = $2, osiguranje_score = $3, 
                    registar_score = $4, zarada_score = $5, prosek_resursa = $6, 
                    updated_at = NOW()
                WHERE procena_id = $7
            `, [kapital_score, menadzeri_score, osiguranje_score, registar_score, zarada_score, prosek_resursa, procenaId]);
        } else {
            // Kreiraj novi zapis
            await pool.query(`
                INSERT INTO prilog_t (
                    procena_id, kapital_score, menadzeri_score, osiguranje_score, 
                    registar_score, zarada_score, prosek_resursa, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [procenaId, kapital_score, menadzeri_score, osiguranje_score, registar_score, zarada_score, prosek_resursa]);
        }

        return NextResponse.json({ success: true, prosek_resursa });
    } catch (error) {
        console.error('Greška pri čuvanju Prilog T podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}
