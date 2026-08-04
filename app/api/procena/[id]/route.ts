import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../lib/db';
import { ProcenaRouteContext } from '../../types';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id } = await context.params;
        const procenaId = id;
        const pool = await getDbConnection();

        // Dobij procenu sa podacima o pravnom licu
        const result = await pool.query(`
                SELECT 
                    pr.id,
                    pr."createdAt" as datum,
                    pr.status,
                    pl.id AS "pravnoLiceId",
                    pl.naziv,
                    pl.pib,
                    pl.adresa
                FROM "ProcenaRizika" pr
                INNER JOIN "PravnoLice" pl ON pr."pravnoLiceId" = pl.id
                WHERE pr.id = $1
            `, [procenaId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Procena nije pronađena' },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0], {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });
    } catch (error) {
        console.error('Greška pri dobijanju procene:', error);
        return NextResponse.json(
            { error: 'Greška pri dobijanju procene' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id } = await context.params;
        const procenaId = id;
        const pool = await getDbConnection();

        // Delete related data (CASCADE delete will handle related records)
        await pool.query('DELETE FROM "RiskSelection" WHERE "procenaId" = $1', [procenaId]);

        // Delete main assessment
        const result = await pool.query('DELETE FROM "ProcenaRizika" WHERE id = $1', [procenaId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Procena nije pronađena' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Procena je uspešno obrisana'
        });

    } catch (error) {
        console.error('Greška pri brisanju procene:', error);
        return NextResponse.json(
            { error: 'Greška pri brisanju procene' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { status } = await request.json();
        const { id } = await context.params;
        const procenaId = id;

        if (!status) {
            return NextResponse.json(
                { error: 'Status je obavezan' },
                { status: 400 }
            );
        }

        const validStatuses = ['u_toku', 'zavrsena', 'na_cekanju', 'otkazana'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Nevaljan status' },
                { status: 400 }
            );
        }

        const pool = await getDbConnection();

        const result = await pool.query(`
                UPDATE "ProcenaRizika"
                SET status = $1
                WHERE id = $2
            `, [status, procenaId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Procena nije pronađena' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Procena je uspešno ažurirana'
        });

    } catch (error) {
        console.error('Greška pri ažuriranju procene:', error);
        return NextResponse.json(
            { error: 'Greška pri ažuriranju procene' },
            { status: 500 }
        );
    }
}
