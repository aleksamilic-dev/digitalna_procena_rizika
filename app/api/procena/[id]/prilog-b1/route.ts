import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';
import { calculatePrilogB1 } from '../../../../data/riskDataLoader';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id: procenaId } = await context.params;

        const pool = await getDbConnection();

        const result = await pool.query(`
            SELECT * FROM prilog_b1
            WHERE procena_id = $1
            ORDER BY group_id
        `, [procenaId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Greška pri dohvatanju Prilog B1 podataka:', error);
        return NextResponse.json({ error: 'Greška pri dohvatanju podataka' }, { status: 500 });
    }
}

// Upisuje celu tabelu B1.1 (SRPS A.L2.003:2025 sa Izmenom 1). Сво po grupama se preuzima
// iz Priloga Lj, kol. 3, a Уд, Иуд, Кво и Иво se računaju iz svih grupa zajedno,
// pa se uvek upisuju svih 11 redova.
export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id: procenaId } = await context.params;
        const { svoPoGrupama } = await request.json() as { svoPoGrupama?: Record<string, unknown> };

        const svoMap = new Map<number, number>();
        Object.entries(svoPoGrupama || {}).forEach(([grupa, svo]) => {
            const brojGrupe = parseInt(grupa);
            const vrednost = Number(svo);
            if (brojGrupe >= 1 && brojGrupe <= 11 && Number.isInteger(vrednost) && vrednost >= 1 && vrednost <= 5) {
                svoMap.set(brojGrupe, vrednost);
            }
        });

        const redovi = calculatePrilogB1(svoMap);
        const pool = await getDbConnection();

        for (const red of redovi) {
            await pool.query(`
                INSERT INTO prilog_b1 (procena_id, group_id, svo, uticaj, iud, kvo, ivo, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                ON CONFLICT (procena_id, group_id) DO UPDATE SET
                    svo = EXCLUDED.svo, uticaj = EXCLUDED.uticaj, iud = EXCLUDED.iud,
                    kvo = EXCLUDED.kvo, ivo = EXCLUDED.ivo, updated_at = NOW()
            `, [procenaId, red.groupNumber, red.svo, red.uticaj, red.iud, red.kvo, red.ivo]);
        }

        return NextResponse.json({ success: true, redovi });
    } catch (error) {
        console.error('Greška pri čuvanju Prilog B1 podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}
