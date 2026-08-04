import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id: procenaId } = await context.params;

        const pool = await getDbConnection();

        // Fetch Prilog CH data
        const chResult = await pool.query(`
            SELECT * FROM prilog_ch 
            WHERE procena_id = $1
        `, [procenaId]);

        // Fetch Prilog T resource average (needed for frontend calculation context)
        const tResult = await pool.query(`
            SELECT prosek_resursa FROM prilog_t 
            WHERE procena_id = $1
        `, [procenaId]);

        return NextResponse.json({
            chData: chResult.rows[0] || {},
            resourceAverage: tResult.rows[0]?.prosek_resursa || 0
        });
    } catch (error) {
        console.error('Greška pri dohvatanju Prilog Ћ podataka:', error);
        return NextResponse.json({ error: 'Greška pri dohvatanju podataka' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id: procenaId } = await context.params;
        const {
            zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, zahtev_dj
        } = await request.json();


        const pool = await getDbConnection();

        // 1. Get Resource Score from Prilog T
        const tResult = await pool.query<{prosek_resursa: number}>(`
            SELECT prosek_resursa FROM prilog_t 
            WHERE procena_id = $1
        `, [procenaId]);

        const resourceScore = Number(tResult.rows[0]?.prosek_resursa || 0);

        // 2. Calculate Final Score
        // Formula: Sum(Fulfillment * ResourceScore) / 6 (items) -> Or explicitly following the table logic
        // Actually, the table implies "Ocena opstih zahteva" is likely the average of the column 4 (Ocena)
        // Row Assessment = Fulfillment (0-5) * ResourceScore
        // Final Score = Average of Row Assessments

        const fulfillments = [zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, zahtev_dj];
        // Filter out nulls if necessary, but standard seems to require all filled. Assume null=0 if missing.

        const validFulfillments = fulfillments.map(f => Number(f ?? 0));

        // Calculate individual row scores
        const rowScores = validFulfillments.map(f => f * resourceScore);

        // Final Average
        const totalScore = rowScores.reduce((a, b) => a + b, 0);
        const finalScore = parseFloat((totalScore / 6).toFixed(2));

        // 3. Save to DB
        const existingResult = await pool.query(`
            SELECT id FROM prilog_ch 
            WHERE procena_id = $1
        `, [procenaId]);

        if (existingResult.rows.length > 0) {
            await pool.query(`
                UPDATE prilog_ch 
                SET zahtev_a = $1, zahtev_b = $2, zahtev_v = $3, 
                    zahtev_g = $4, zahtev_d = $5, zahtev_dj = $6, 
                    final_score = $7, updated_at = NOW()
                WHERE procena_id = $8
            `, [zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, zahtev_dj, finalScore, procenaId]);
        } else {
            await pool.query(`
                INSERT INTO prilog_ch (
                    procena_id, zahtev_a, zahtev_b, zahtev_v, 
                    zahtev_g, zahtev_d, zahtev_dj, final_score, 
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [procenaId, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, zahtev_dj, finalScore]);
        }

        return NextResponse.json({ success: true, finalScore, resourceScore });
    } catch (error) {
        console.error('Greška pri čuvanju Prilog Ћ podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}
