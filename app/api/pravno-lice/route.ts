import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db";
import { handleApiError } from "../../../lib/api-error";

export async function POST(req: Request) {
    try {
        const {
            naziv,
            pib,
            maticni_broj
        } = await req.json();

        if (!naziv || !pib) {
            return NextResponse.json({ error: "Naziv i PIB su obavezni" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Check if legal entity with this PIB already exists
        const existingEntity = await pool.query('SELECT id, naziv FROM PravnoLice WHERE pib = $1', [pib]);

        if (existingEntity.rows.length > 0) {
            return NextResponse.json({
                error: `Pravno lice sa PIB ${pib} već postoji (${existingEntity.rows[0].naziv})`
            }, { status: 400 });
        }

        // Check if legal entity with this matični broj already exists (if provided)
        if (maticni_broj) {
            const existingMaticni = await pool.query('SELECT id, naziv FROM PravnoLice WHERE maticni_broj = $1', [maticni_broj]);
            if (existingMaticni.rows.length > 0) {
                return NextResponse.json({
                    error: `Pravno lice sa matičnim brojem ${maticni_broj} već postoji (${existingMaticni.rows[0].naziv})`
                }, { status: 400 });
            }
        }

        await pool.query(`
            INSERT INTO PravnoLice (naziv, pib, maticni_broj)
            VALUES ($1, $2, $3)
        `, [naziv, pib, maticni_broj || null]);

        // Get the inserted ID using SCOPE_IDENTITY()
        const idResult = await pool.query('SELECT CAST(SCOPE_IDENTITY() as INT) as id');
        const pravnoLiceId = idResult.rows[0].id;

        // Create new risk assessment for this legal entity
        await pool.query(`
                INSERT INTO ProcenaRizika (naziv, pravnoLiceId, status) 
                VALUES ($1, $2, $3)
            `, [`Procena rizika - ${naziv}`, pravnoLiceId, 'u_toku']);

        // Get the inserted procena ID
        const procenaIdResult = await pool.query('SELECT CAST(SCOPE_IDENTITY() as INT) as id');
        const procenaId = procenaIdResult.rows[0].id;

        return NextResponse.json({
            success: true,
            pravnoLiceId: pravnoLiceId,
            procenaId: procenaId
        });
    } catch (error) {
        return handleApiError(error, "kreiranje pravnog lica");
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const pool = await getDbConnection();

        // Get total count first
        const countResult = await pool.query('SELECT COUNT(*) as total FROM PravnoLice');
        const total = countResult.rows[0].total;

        const result = await pool.query(`
            SELECT 
                pl.id,
                pl.naziv,
                pl.skraceno_poslovno_ime,
                pl.pib,
                pl.maticni_broj,
                pl.adresa,
                pl.adresa_sediste,
                pl.adresa_ostala,
                pl.sifra_delatnosti,
                pl.lice_zastupanje,
                pl.lice_komunikacija,
                pl.tim_procena_rizika,
                pl.telefon,
                pl.telefon_faks,
                pl.internet_adresa,
                pl.email,
                pr.id as procenaId,
                pr.createdAt as datum,
                pr.status,
                u.id as uslugaId,
                u.naziv_usluge,
                u.datum_izrade,
                u.opis as usluga_opis
            FROM PravnoLice pl
            LEFT JOIN ProcenaRizika pr ON pl.id = pr.pravnoLiceId
            LEFT JOIN Usluge u ON pl.id = u.pravnoLiceId
            ORDER BY pl.id, pr.createdAt DESC, u.createdAt DESC
            OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY
        `, [offset, limit]);

        // Group the results by pravno lice
        const pravnaLicaMap = new Map();

        result.rows.forEach(row => {
            if (!pravnaLicaMap.has(row.id)) {
                pravnaLicaMap.set(row.id, {
                    id: row.id,
                    naziv: row.naziv,
                    skraceno_poslovno_ime: row.skraceno_poslovno_ime,
                    pib: row.pib,
                    maticni_broj: row.maticni_broj,
                    adresa: row.adresa,
                    adresa_sediste: row.adresa_sediste,
                    adresa_ostala: row.adresa_ostala,
                    sifra_delatnosti: row.sifra_delatnosti,
                    lice_zastupanje: row.lice_zastupanje,
                    lice_komunikacija: row.lice_komunikacija,
                    tim_procena_rizika: row.tim_procena_rizika,
                    telefon: row.telefon,
                    telefon_faks: row.telefon_faks,
                    internet_adresa: row.internet_adresa,
                    email: row.email,
                    procene: [],
                    usluge: []
                });
            }

            const pravnoLice = pravnaLicaMap.get(row.id);

            const procenaId = row.procenaId ?? row.procenaid;
            const uslugaId = row.uslugaId ?? row.uslugaid;

            // Dodaj procenu ako postoji i nije već dodana
            if (procenaId && !pravnoLice.procene.find((p: { id: number }) => p.id === procenaId)) {
                pravnoLice.procene.push({
                    id: procenaId,
                    datum: row.datum,
                    status: row.status,
                    pravnoLiceId: row.id
                });
            }

            // Dodaj uslugu ako postoji i nije već dodana
            if (uslugaId && !pravnoLice.usluge.find((u: { id: number }) => u.id === uslugaId)) {
                pravnoLice.usluge.push({
                    id: uslugaId,
                    naziv_usluge: row.naziv_usluge,
                    datum_izrade: row.datum_izrade,
                    opis: row.usluga_opis
                });
            }
        });

        const pravnaLica = Array.from(pravnaLicaMap.values());
        return NextResponse.json({
            data: pravnaLica,
            pagination: {
                page,
                limit,
                total: Number(total),
                totalPages: Math.ceil(Number(total) / limit)
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });
    } catch (error) {
        return handleApiError(error, "dohvatanje pravnih lica");
    }
}

export async function PUT(req: Request) {
    try {
        const { pravnoLiceId, naziv_usluge, datum_izrade, opis } = await req.json();

        if (!pravnoLiceId || !naziv_usluge) {
            return NextResponse.json({ error: "ID pravnog lica i naziv usluge su obavezni" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Dodaj novu uslugu
        await pool.query(`
            INSERT INTO Usluge (pravnoLiceId, naziv_usluge, datum_izrade, opis)
            VALUES ($1, $2, $3, $4)
        `, [pravnoLiceId, naziv_usluge, datum_izrade || new Date().toISOString().split('T')[0], opis || null]);

        // Get the inserted ID
        const idResult = await pool.query('SELECT CAST(SCOPE_IDENTITY() as INT) as id');
        const uslugaId = idResult.rows[0].id;

        return NextResponse.json({
            success: true,
            message: "Usluga je uspešno dodana",
            uslugaId: uslugaId
        });
    } catch (error) {
        return handleApiError(error, "dodavanje usluge");
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID pravnog lica je obavezan" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Prvo obriši sve povezane procene rizika i njihove podatke
        // Koristi CASCADE DELETE koji je definisan u tabeli
        await pool.query('DELETE FROM FinancialData WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);
        await pool.query('DELETE FROM PrilogM WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);
        await pool.query('DELETE FROM RiskSelection WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);

        // Obriši procene rizika
        await pool.query('DELETE FROM ProcenaRizika WHERE pravnoLiceId = $1', [id]);

        // Zatim obriši pravno lice
        const result = await pool.query('DELETE FROM PravnoLice WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Pravno lice nije pronađeno" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Pravno lice je uspešno obrisano" });
    } catch (error) {
        return handleApiError(error, "brisanje pravnog lica");
    }
}
