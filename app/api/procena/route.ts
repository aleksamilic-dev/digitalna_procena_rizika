import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection, getRawPool } from '../../../lib/db';
import { handleApiError } from '../../../lib/api-error';
import { RISK_GROUPS } from '../../data/riskGroups';
import { getRiskGroupData } from '../../data/riskDataLoader';

// Ukupan broj stavki u prilozima В-Л; procena je gotova kada je svaka stavka procenjena ili označena kao N/A
const UKUPNO_STAVKI = RISK_GROUPS.reduce((ukupno, group) =>
    ukupno + (getRiskGroupData(group.id)?.risks.reduce((zbir, risk) => zbir + risk.items.length, 0) ?? 0), 0);

export async function GET() {
    try {
        const pool = await getDbConnection();

        // Dobij sve procene sa podacima o pravnom licu
        const result = await pool.query(`
            SELECT
                pr.id,
                pr."createdAt" as datum,
                pr.status,
                pl.id AS "pravnoLiceId",
                pl.naziv,
                pl.pib,
                pl.adresa,
                -- Statistike za svaku procenu iz PrilogM tabele
                (SELECT COUNT(*)::int FROM "PrilogM" pm WHERE pm."procenaId" = pr.id) as "ukupnoRizika",
                (SELECT COUNT(*)::int FROM "PrilogM" pm WHERE pm."procenaId" = pr.id AND pm."kategorijaRizika" IN ('1', '2')) as "visokoRizicniRizici",
                -- Završene stavke: procenjene (Prilog M) i označene kao N/A
                (SELECT COUNT(*)::int FROM (
                    SELECT pm."itemId" FROM "PrilogM" pm WHERE pm."procenaId" = pr.id
                    UNION
                    SELECT rs."riskId" FROM "RiskSelection" rs WHERE rs."procenaId" = pr.id AND rs."dangerLevel" = 0
                ) zavrsene) as "zavrsenoStavki"
            FROM "ProcenaRizika" pr
            INNER JOIN "PravnoLice" pl ON pr."pravnoLiceId" = pl.id
            ORDER BY pr."createdAt" DESC
        `);

        const procene = result.rows.map(row => ({ ...row, ukupnoStavki: UKUPNO_STAVKI }));

        return NextResponse.json(procene, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });
    } catch (error) {
        return handleApiError(error, "dobijanje procena");
    }
}

export async function POST(request: NextRequest) {
    try {
        const { pravnoLiceId } = await request.json();

        if (!pravnoLiceId) {
            return NextResponse.json(
                { error: 'pravnoLiceId je obavezan' },
                { status: 400 }
            );
        }

        const client = await getRawPool().connect();

        try {
            await client.query('BEGIN');

            // Proveri da li već postoji aktivna procena za ovo pravno lice
            const existingAssessment = await client.query(`
                SELECT id, status FROM "ProcenaRizika"
                WHERE "pravnoLiceId" = $1 AND status = 'u_toku'
                ORDER BY "createdAt" DESC
                LIMIT 1
            `, [pravnoLiceId]);

            if (existingAssessment.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({
                    error: 'Već postoji aktivna procena rizika za ovo pravno lice',
                    existingProcenaId: existingAssessment.rows[0].id
                }, { status: 400 });
            }

            // Get the legal entity name for the assessment title
            const pravnoLiceResult = await client.query('SELECT naziv FROM "PravnoLice" WHERE id = $1', [pravnoLiceId]);

            if (pravnoLiceResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { error: 'Pravno lice sa datim ID ne postoji' },
                    { status: 404 }
                );
            }

            const pravnoLiceNaziv = pravnoLiceResult.rows[0].naziv;

            // Za svaki prilog pronađi poslednju dostupnu procenu koja ima sačuvane podatke.
            const sourceAssessments = await client.query<{
                t_procena_id: number | null;
                u_procena_id: number | null;
                ch_procena_id: number | null;
            }>(`
                SELECT
                    (
                        SELECT t.procena_id
                        FROM prilog_t t
                        INNER JOIN "ProcenaRizika" pr ON pr.id = t.procena_id
                        ORDER BY pr."createdAt" DESC, pr.id DESC
                        LIMIT 1
                    ) AS t_procena_id,
                    (
                        SELECT u.procena_id
                        FROM prilog_u u
                        INNER JOIN "ProcenaRizika" pr ON pr.id = u.procena_id
                        ORDER BY pr."createdAt" DESC, pr.id DESC
                        LIMIT 1
                    ) AS u_procena_id,
                    (
                        SELECT ch.procena_id
                        FROM prilog_ch ch
                        INNER JOIN "ProcenaRizika" pr ON pr.id = ch.procena_id
                        ORDER BY pr."createdAt" DESC, pr.id DESC
                        LIMIT 1
                    ) AS ch_procena_id
            `);

            // Kreiraj novu procenu
            const procenaInsertResult = await client.query<{ id: number; createdAt: Date; status: string }>(`
                INSERT INTO "ProcenaRizika" (naziv, "pravnoLiceId", status)
                VALUES ($1, $2, 'u_toku')
                RETURNING id, "createdAt", status
            `, [`Procena rizika - ${pravnoLiceNaziv}`, pravnoLiceId]);

            const novaProcena = procenaInsertResult.rows[0];

            if (!novaProcena?.id) {
                throw new Error('Greška pri kreiranju procene rizika');
            }

            const source = sourceAssessments.rows[0];
            if (source?.t_procena_id) {
                await client.query(`
                    INSERT INTO prilog_t (
                        procena_id, kapital_score, menadzeri_score, osiguranje_score,
                        registar_score, zarada_score, prosek_resursa, created_at, updated_at
                    )
                    SELECT $1, kapital_score, menadzeri_score, osiguranje_score,
                        registar_score, zarada_score, prosek_resursa, NOW(), NOW()
                    FROM prilog_t WHERE procena_id = $2
                `, [novaProcena.id, source.t_procena_id]);
            }

            if (source?.u_procena_id) {
                await client.query(`
                    INSERT INTO prilog_u (
                        procena_id, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d,
                        final_score, updated_at
                    )
                    SELECT $1, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d,
                        final_score, NOW()
                    FROM prilog_u WHERE procena_id = $2
                `, [novaProcena.id, source.u_procena_id]);
            }

            if (source?.ch_procena_id) {
                await client.query(`
                    INSERT INTO prilog_ch (
                        procena_id, zahtev_a, zahtev_b, zahtev_v, zahtev_g, zahtev_d,
                        zahtev_dj, final_score, created_at, updated_at
                    )
                    SELECT $1, ch.zahtev_a, ch.zahtev_b, u.final_score, ch.zahtev_g, ch.zahtev_d,
                        ch.zahtev_dj,
                        ROUND((
                            COALESCE(ch.zahtev_a, 0)::numeric
                            + COALESCE(ch.zahtev_b, 0)::numeric
                            + COALESCE(u.final_score, 0)::numeric
                            + COALESCE(ch.zahtev_g, 0)::numeric
                            + COALESCE(ch.zahtev_d, 0)::numeric
                            + COALESCE(ch.zahtev_dj, 0)::numeric
                        ) * COALESCE(t.prosek_resursa, 0)::numeric / 6, 2),
                        NOW(), NOW()
                    FROM prilog_ch ch
                    LEFT JOIN prilog_u u ON u.procena_id = $1
                    LEFT JOIN prilog_t t ON t.procena_id = $1
                    WHERE ch.procena_id = $2
                `, [novaProcena.id, source.ch_procena_id]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                procenaId: novaProcena.id,
                pravnoLiceId: pravnoLiceId,
                datum: novaProcena.createdAt,
                status: novaProcena.status
            });
        } catch (error) {
            await client.query('ROLLBACK').catch(() => undefined);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        return handleApiError(error, "kreiranje procene");
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { procenaId, naziv_usluge, datum_izrade } = await request.json();

        if (!procenaId) {
            return NextResponse.json(
                { error: 'procenaId je obavezan' },
                { status: 400 }
            );
        }

        const pool = await getDbConnection();

        // Ažuriraj procenu sa novim podacima
        await pool.query(`
            UPDATE "ProcenaRizika"
            SET naziv_usluge = $1, datum_izrade = $2, "updatedAt" = NOW()
            WHERE id = $3
        `, [naziv_usluge, datum_izrade, procenaId]);

        // Fetch the updated record
        const result = await pool.query(`
            SELECT id, naziv_usluge, datum_izrade,
                   datum_izrade + INTERVAL '3 years' as rok_vazenja
            FROM "ProcenaRizika" WHERE id = $1
        `, [procenaId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Procena sa datim ID ne postoji' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        return handleApiError(error, "ažuriranje procene");
    }
}
