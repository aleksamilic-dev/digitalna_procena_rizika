import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
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
        const pool = await getDbConnection();

        // Calculate final score
        const scores = [
            body.zahtev_a,
            body.zahtev_b,
            body.zahtev_v,
            body.zahtev_g,
            body.zahtev_d
        ].filter(v => v !== null && v !== undefined);

        const finalScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const existingResult = await pool.query(
            'SELECT id FROM prilog_u WHERE procena_id = $1',
            [procenaId]
        );

        if (existingResult.rows.length > 0) {
            await pool.query(
                `UPDATE prilog_u
                 SET zahtev_a = $1,
                     zahtev_b = $2,
                     zahtev_v = $3,
                     zahtev_g = $4,
                     zahtev_d = $5,
                     final_score = $6,
                     updated_at = GETDATE()
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
            await pool.query(
                `INSERT INTO prilog_u (
                    procena_id, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d, final_score, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, GETDATE())`,
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

        return NextResponse.json({ success: true, finalScore });

    } catch (error) {
        console.error('Error saving Prilog U data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
