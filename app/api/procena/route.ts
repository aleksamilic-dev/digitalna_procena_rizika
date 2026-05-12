import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';
import { handleApiError } from '../../../lib/api-error';

export async function GET() {
    try {
        const pool = await getDbConnection();

        // Dobij sve procene sa podacima o pravnom licu
        const result = await pool.query(`
            SELECT 
                pr.id,
                pr.createdAt as datum,
                pr.status,
                pl.id as pravnoLiceId,
                pl.naziv,
                pl.pib,
                pl.adresa,
                -- Statistike za svaku procenu iz PrilogM tabele
                (SELECT COUNT(*) FROM PrilogM pm WHERE pm.procenaId = pr.id) as ukupnoRizika,
                (SELECT COUNT(*) FROM PrilogM pm WHERE pm.procenaId = pr.id AND pm.kategorijaRizika IN (1, 2)) as visokoRizicniRizici
            FROM ProcenaRizika pr
            INNER JOIN PravnoLice pl ON pr.pravnoLiceId = pl.id
            ORDER BY pr.createdAt DESC
        `);

        return NextResponse.json(result.rows, {
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

        const pool = await getDbConnection();

        // Proveri da li već postoji aktivna procena za ovo pravno lice
        const existingAssessment = await pool.query(`
            SELECT TOP 1 id, status FROM ProcenaRizika
            WHERE pravnoLiceId = $1 AND status = 'u_toku'
            ORDER BY createdAt DESC
        `, [pravnoLiceId]);

        if (existingAssessment.rows.length > 0) {
            return NextResponse.json({
                error: 'Već postoji aktivna procena rizika za ovo pravno lice',
                existingProcenaId: existingAssessment.rows[0].id
            }, { status: 400 });
        }

        // Get the legal entity name for the assessment title
        const pravnoLiceResult = await pool.query('SELECT naziv FROM PravnoLice WHERE id = $1', [pravnoLiceId]);

        if (pravnoLiceResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Pravno lice sa datim ID ne postoji' },
                { status: 404 }
            );
        }

        const pravnoLiceNaziv = pravnoLiceResult.rows[0].naziv;

        // Kreiraj novu procenu
        await pool.query(`
                INSERT INTO ProcenaRizika (naziv, pravnoLiceId, status)
                VALUES ($1, $2, 'u_toku')
            `, [`Procena rizika - ${pravnoLiceNaziv}`, pravnoLiceId]);

        // Get the inserted record
        const idResult = await pool.query('SELECT CAST(SCOPE_IDENTITY() as INT) as id');
        const procenaId = idResult.rows[0].id;
        
        const procenaResult = await pool.query(`
            SELECT id, createdAt, status FROM ProcenaRizika WHERE id = $1
        `, [procenaId]);
        
        const novaProcena = procenaResult.rows[0];

        return NextResponse.json({
            success: true,
            procenaId: novaProcena.id,
            pravnoLiceId: pravnoLiceId,
            datum: novaProcena.createdAt,
            status: novaProcena.status
        });
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
            UPDATE ProcenaRizika 
            SET naziv_usluge = $1, datum_izrade = $2, updatedAt = GETDATE()
            WHERE id = $3
        `, [naziv_usluge, datum_izrade, procenaId]);

        // Fetch the updated record
        const result = await pool.query(`
            SELECT id, naziv_usluge, datum_izrade,
                   DATEADD(year, 3, datum_izrade) as rok_vazenja
            FROM ProcenaRizika WHERE id = $1
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
