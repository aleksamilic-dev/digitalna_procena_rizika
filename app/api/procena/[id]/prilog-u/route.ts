import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection, getRawPool } from '@/lib/db';
import { ProcenaRouteContext } from '../../../types';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const pool = await getDbConnection();

        const uResult = await pool.query(
            'SELECT * FROM prilog_u WHERE procena_id = $1',
            [procenaId]
        );

        return NextResponse.json({
            uData: uResult.rows[0] || null
        });

    } catch (error) {
        console.error('Error fetching Prilog U data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const body = await request.json();
        const client = await getRawPool().connect();

        // Calculate final score
        const scores = [
            body.zahtev_a,
            body.zahtev_b,
            body.zahtev_v,
            body.zahtev_g,
            body.zahtev_d
        ].filter(v => v !== null && v !== undefined);

        // Ocena se čuva sa 2 decimale (numeric(10,2)); ista vrednost se prenosi u Prilog Ћ
        const finalScore = scores.length > 0
            ? parseFloat((scores.reduce((a, b) => Number(a) + Number(b), 0) / scores.length).toFixed(2))
            : 0;

        try {
            await client.query('BEGIN');

            const existingResult = await client.query(
                'SELECT id FROM prilog_u WHERE procena_id = $1',
                [procenaId]
            );

            if (existingResult.rows.length > 0) {
                await client.query(
                    `UPDATE prilog_u
                     SET zahtev_a = $1,
                         zahtev_b = $2,
                         zahtev_v = $3,
                         zahtev_g = $4,
                         zahtev_d = $5,
                         final_score = $6,
                         updated_at = NOW()
                     WHERE procena_id = $7`,
                    [
                        body.zahtev_a,
                        body.zahtev_b,
                        body.zahtev_v,
                        body.zahtev_g,
                        body.zahtev_d,
                        finalScore,
                        procenaId
                    ]
                );
            } else {
                await client.query(
                    `INSERT INTO prilog_u (
                        procena_id, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, final_score, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [
                        procenaId,
                        body.zahtev_a,
                        body.zahtev_b,
                        body.zahtev_v,
                        body.zahtev_g,
                        body.zahtev_d,
                        finalScore
                    ]
                );
            }

            // Čim se ocena u Prilogu U promeni, uskladi izvedenu vrednost u Prilogu Ć.
            await client.query(`
                UPDATE prilog_ch ch
                SET zahtev_v = $2,
                    final_score = ROUND((
                        COALESCE(ch.zahtev_a, 0)::numeric
                        + COALESCE(ch.zahtev_b, 0)::numeric
                        + $2::numeric
                        + COALESCE(ch.zahtev_g, 0)::numeric
                        + COALESCE(ch.zahtev_d, 0)::numeric
                        + COALESCE(ch.zahtev_dj, 0)::numeric
                    ) * COALESCE((
                        SELECT prosek_resursa::numeric
                        FROM prilog_t WHERE procena_id = $1
                    ), 0::numeric) / 6, 2),
                    updated_at = NOW()
                WHERE ch.procena_id = $1
            `, [procenaId, finalScore]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => undefined);
            throw error;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, finalScore });

    } catch (error) {
        console.error('Error saving Prilog U data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
