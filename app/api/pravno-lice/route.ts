import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db";
import { handleApiError } from "../../../lib/api-error";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            naziv,
            skraceno_poslovno_ime,
            pib,
            maticni_broj,
            adresa_sediste,
            adresa_ostala,
            sifra_delatnosti,
            lice_zastupanje,
            lice_komunikacija,
            tim_procena_rizika,
            telefon_faks,
            internet_adresa,
            adresa,
            email,
            telefon
        } = body;

        const cleanNaziv = naziv ? String(naziv).trim() : '';
        const cleanPib = pib ? String(pib).trim() : '';
        const cleanMaticni = maticni_broj ? String(maticni_broj).trim() : null;

        if (!cleanNaziv || !cleanPib) {
            return NextResponse.json({ error: "Naziv i PIB su obavezni" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Check if legal entity with this PIB already exists
        const existingEntity = await pool.query<{ id: number; naziv: string }>(
            'SELECT id, naziv FROM PravnoLice WHERE LTRIM(RTRIM(pib)) = $1',
            [cleanPib]
        );

        if (existingEntity.rows.length > 0) {
            return NextResponse.json({
                error: `Pravno lice sa PIB ${cleanPib} već postoji (${existingEntity.rows[0].naziv})`
            }, { status: 400 });
        }

        // Check if legal entity with this matični broj already exists (if provided)
        if (cleanMaticni) {
            const existingMaticni = await pool.query<{ id: number; naziv: string }>(
                'SELECT id, naziv FROM PravnoLice WHERE LTRIM(RTRIM(maticni_broj)) = $1',
                [cleanMaticni]
            );
            if (existingMaticni.rows.length > 0) {
                return NextResponse.json({
                    error: `Pravno lice sa matičnim brojem ${cleanMaticni} već postoji (${existingMaticni.rows[0].naziv})`
                }, { status: 400 });
            }
        }

        // Insert PravnoLice using OUTPUT INSERTED.id for reliable atomic identity retrieval in pooled MSSQL connections
        const insertResult = await pool.query<{ id: number }>(`
            INSERT INTO PravnoLice (
                naziv,
                skraceno_poslovno_ime,
                pib,
                maticni_broj,
                adresa,
                adresa_sediste,
                adresa_ostala,
                sifra_delatnosti,
                lice_zastupanje,
                lice_komunikacija,
                tim_procena_rizika,
                telefon,
                telefon_faks,
                email,
                internet_adresa
            )
            OUTPUT INSERTED.id
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
            cleanNaziv,
            skraceno_poslovno_ime?.trim() || null,
            cleanPib,
            cleanMaticni,
            (adresa || adresa_sediste)?.trim() || null,
            adresa_sediste?.trim() || null,
            adresa_ostala?.trim() || null,
            sifra_delatnosti?.trim() || null,
            lice_zastupanje?.trim() || null,
            lice_komunikacija?.trim() || null,
            tim_procena_rizika?.trim() || null,
            (telefon || telefon_faks)?.trim() || null,
            telefon_faks?.trim() || null,
            email?.trim() || null,
            internet_adresa?.trim() || null
        ]);

        const pravnoLiceId = insertResult.rows[0]?.id;

        if (!pravnoLiceId) {
            return NextResponse.json({ error: "Greška pri kreiranju pravnog lica (ID nije sačuvan)" }, { status: 500 });
        }

        // Create new risk assessment for this legal entity
        const procenaInsertResult = await pool.query<{ id: number }>(`
            INSERT INTO ProcenaRizika (naziv, pravnoLiceId, status) 
            OUTPUT INSERTED.id
            VALUES ($1, $2, $3)
        `, [`Procena rizika - ${cleanNaziv}`, pravnoLiceId, 'u_toku']);

        const procenaId = procenaInsertResult.rows[0]?.id;

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
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const pool = await getDbConnection();

        // Get total count of PravnoLice entities
        const countResult = await pool.query<{ total: number }>('SELECT COUNT(*) as total FROM PravnoLice');
        const total = countResult.rows[0]?.total || 0;

        // First select paginated IDs of PravnoLice to prevent LEFT JOIN duplication in OFFSET/FETCH NEXT
        const idsResult = await pool.query<{ id: number }>(`
            SELECT id FROM PravnoLice
            ORDER BY id DESC
            OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY
        `, [offset, limit]);

        if (idsResult.rows.length === 0) {
            return NextResponse.json({
                data: [],
                pagination: {
                    page,
                    limit,
                    total: Number(total),
                    totalPages: Math.ceil(Number(total) / limit)
                }
            });
        }

        const ids = idsResult.rows.map(r => r.id);
        const idsList = ids.join(',');

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
            WHERE pl.id IN (${idsList})
            ORDER BY pl.id DESC, pr.createdAt DESC, u.createdAt DESC
        `);

        // Group the results by pravno lice
        const pravnaLicaMap = new Map();

        result.rows.forEach(row => {
            const id = Number(row.id);
            if (!pravnaLicaMap.has(id)) {
                pravnaLicaMap.set(id, {
                    id: id,
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

            const pravnoLice = pravnaLicaMap.get(id);

            const procenaId = row.procenaId ?? row.procenaid;
            const uslugaId = row.uslugaId ?? row.uslugaid;

            // Dodaj procenu ako postoji i nije već dodana
            if (procenaId && !pravnoLice.procene.find((p: { id: number }) => p.id === Number(procenaId))) {
                pravnoLice.procene.push({
                    id: Number(procenaId),
                    datum: row.datum,
                    status: row.status,
                    pravnoLiceId: id
                });
            }

            // Dodaj uslugu ako postoji i nije već dodana
            if (uslugaId && !pravnoLice.usluge.find((u: { id: number }) => u.id === Number(uslugaId))) {
                pravnoLice.usluge.push({
                    id: Number(uslugaId),
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
        const body = await req.json();
        const pool = await getDbConnection();

        // Check if updating Usluga (legacy call) or updating PravnoLice details
        if (body.naziv_usluge) {
            const { pravnoLiceId, naziv_usluge, datum_izrade, opis } = body;
            if (!pravnoLiceId || !naziv_usluge) {
                return NextResponse.json({ error: "ID pravnog lica i naziv usluge su obavezni" }, { status: 400 });
            }

            const insertResult = await pool.query<{ id: number }>(`
                INSERT INTO Usluge (pravnoLiceId, naziv_usluge, datum_izrade, opis)
                OUTPUT INSERTED.id
                VALUES ($1, $2, $3, $4)
            `, [pravnoLiceId, naziv_usluge, datum_izrade || new Date().toISOString().split('T')[0], opis || null]);

            const uslugaId = insertResult.rows[0]?.id;

            return NextResponse.json({
                success: true,
                message: "Usluga je uspešno dodana",
                uslugaId: uslugaId
            });
        }

        // Updating PravnoLice details
        const { id, naziv, pib, maticni_broj } = body;
        if (!id) {
            return NextResponse.json({ error: "ID pravnog lica je obavezan" }, { status: 400 });
        }

        await pool.query(`
            UPDATE PravnoLice
            SET naziv = COALESCE($1, naziv),
                pib = COALESCE($2, pib),
                maticni_broj = COALESCE($3, maticni_broj),
                updatedAt = GETDATE()
            WHERE id = $4
        `, [naziv || null, pib || null, maticni_broj || null, id]);

        return NextResponse.json({
            success: true,
            message: "Pravno lice je uspešno ažurirano"
        });
    } catch (error) {
        return handleApiError(error, "ažuriranje pravnog lica");
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
        await pool.query('DELETE FROM FinancialData WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);
        await pool.query('DELETE FROM PrilogM WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);
        await pool.query('DELETE FROM RiskSelection WHERE procenaId IN (SELECT id FROM ProcenaRizika WHERE pravnoLiceId = $1)', [id]);
        // ClanoviTimaProceneRizika zavisi od OrganizacijaProceneRizika — mora se obrisati pre roditeljskog reda
        await pool.query('DELETE FROM ClanoviTimaProceneRizika WHERE organizacijaId IN (SELECT id FROM OrganizacijaProceneRizika WHERE pravnoLiceId = $1)', [id]);
        await pool.query('DELETE FROM OrganizacijaProceneRizika WHERE pravnoLiceId = $1', [id]);
        await pool.query('DELETE FROM Usluge WHERE pravnoLiceId = $1', [id]);

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

