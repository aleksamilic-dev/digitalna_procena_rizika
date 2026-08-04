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

export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { id: procenaId } = await context.params;
        const { groupId, svo } = await request.json();

        const pool = await getDbConnection();

        // NOVA KALKULACIJA PREMA SRPS A.L2.003:2025 - PRILOG B1, TABELA B1.1
        
        // Prvo, dohvati sve Svo vrednosti za ovu procenu da izračunamo ukupan zbir
        const allSvoResult = await pool.query(`
            SELECT group_id, svo FROM prilog_b1 
            WHERE procena_id = $1
        `, [procenaId]);

        // Kreiraj mapu sa trenutnim Svo vrednostima
        const svoMap = new Map<number, number>();
        allSvoResult.rows.forEach((row: Record<string, unknown>) => {
            svoMap.set(row.group_id as number, row.svo as number);
        });
        
        // Ažuriraj sa novom vrednošću
        svoMap.set(groupId, svo);

        // Izračunaj ukupan zbir Svo (ΣСво)
        let totalSvo = 0;
        svoMap.forEach(value => {
            totalSvo += value;
        });

        // Kol. 4: Uticaj delatnosti (Уд) = Сво/ΣСво × 100%
        const uticaj = totalSvo > 0 ? (svo / totalSvo) * 100 : 0;

        // Kol. 5: Indeks uticaja delatnosti (Иуд) - decimalni prikaz Уд
        const iud = uticaj / 100;

        // Kol. 6: Koeficijent veličine opasnosti (Кво)
        // 0,1 ako je Сво = 1; 0,15 ako je Сво = 2; 0,2 ako je Сво = 3; 
        // 0,25 ako je Сво = 4; 0,3 ako je Сво = 5
        const kvoMapping: { [key: number]: number } = { 0: 0, 1: 0.1, 2: 0.15, 3: 0.2, 4: 0.25, 5: 0.3 };
        const kvo = kvoMapping[svo] || 0;

        // Kol. 7: Indeks veličine opasnosti (Иво) = Иуд × Кво
        const ivo = iud * kvo;

        // Proveri da li već postoji zapis
        const existingResult = await pool.query(`
            SELECT id FROM prilog_b1 
            WHERE procena_id = $1 AND group_id = $2
        `, [procenaId, groupId]);

        if (existingResult.rows.length > 0) {
            // Ažuriraj postojeći zapis
            await pool.query(`
                UPDATE prilog_b1 
                SET svo = $1, uticaj = $2, iud = $3, kvo = $4, ivo = $5, updated_at = NOW()
                WHERE procena_id = $6 AND group_id = $7
            `, [svo, uticaj, iud, kvo, ivo, procenaId, groupId]);
        } else {
            // Kreiraj novi zapis
            await pool.query(`
                INSERT INTO prilog_b1 (procena_id, group_id, svo, uticaj, iud, kvo, ivo, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [procenaId, groupId, svo, uticaj, iud, kvo, ivo]);
        }

        // Ažuriraj sve ostale zapise da imaju tačan procenat uticaja
        for (const [otherGroupId, otherSvo] of svoMap.entries()) {
            if (otherGroupId !== groupId) {
                const otherUticaj = totalSvo > 0 ? (otherSvo / totalSvo) * 100 : 0;
                const otherIud = otherUticaj / 100;
                const otherKvo = kvoMapping[otherSvo] || 0;
                const otherIvo = otherIud * otherKvo;

                await pool.query(`
                    UPDATE prilog_b1 
                    SET uticaj = $1, iud = $2, kvo = $3, ivo = $4, updated_at = NOW()
                    WHERE procena_id = $5 AND group_id = $6
                `, [otherUticaj, otherIud, otherKvo, otherIvo, procenaId, otherGroupId]);
            }
        }

        return NextResponse.json({ 
            success: true,
            svo,
            uticaj,
            iud,
            kvo,
            ivo
        });
    } catch (error) {
        console.error('Greška pri čuvanju Prilog B1 podataka:', error);
        return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
    }
}
