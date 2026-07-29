import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pravnoLiceId = parseInt(id);

        if (!pravnoLiceId) {
            return NextResponse.json(
                { error: 'Neispravan ID pravnog lica' },
                { status: 400 }
            );
        }

        const pool = await getDbConnection();

        // Učitaj podatke o organizaciji
        const orgResult = await pool.query(
            `SELECT * FROM OrganizacijaProceneRizika WHERE pravnoLiceId = $1`,
            [pravnoLiceId]
        );

        let organizacija = orgResult.rows[0];

        // Ako ne postoji, kreiraj sa default vrednostima
        if (!organizacija) {
            // Koristi OUTPUT INSERTED.id za pouzdano dobijanje ID-ja u pooled konekcijama
            const newOrgInsert = await pool.query<{ id: number }>(
                `INSERT INTO OrganizacijaProceneRizika (pravnoLiceId) 
                 OUTPUT INSERTED.id
                 VALUES ($1)`,
                [pravnoLiceId]
            );
            const newOrgId = newOrgInsert.rows[0]?.id;

            // Fetch the created record
            const newOrgResult = await pool.query(
                `SELECT * FROM OrganizacijaProceneRizika WHERE id = $1`,
                [newOrgId]
            );
            organizacija = newOrgResult.rows[0];

            // Dodaj default članove tima
            await pool.query(
                `INSERT INTO ClanoviTimaProceneRizika (organizacijaId, ime, broj_licence, redni_broj)
                 VALUES 
                   ($1, 'Ivana Stanković, spec. strukovni ssc', '03.27 broj 34147 od 14.07.2023. godine', 1),
                   ($1, 'Mihajlo Milošević, master inž. ZKS', '03.27 broj 21445 od 06.07.2022. godine', 2)`,
                [organizacija.id]
            );
        }

        // Učitaj članove tima
        const clanoviResult = await pool.query(
            `SELECT * FROM ClanoviTimaProceneRizika 
       WHERE organizacijaId = $1 
       ORDER BY redni_broj`,
            [organizacija.id]
        );

        return NextResponse.json({
            organizacija,
            clanoviTima: clanoviResult.rows
        });
    } catch (error) {
        console.error('Greška pri učitavanju podataka o organizaciji:', error);
        return NextResponse.json(
            { error: 'Greška pri učitavanju podataka' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pravnoLiceId = parseInt(id);
        const data = await request.json();

        if (!pravnoLiceId) {
            return NextResponse.json(
                { error: 'Neispravan ID pravnog lica' },
                { status: 400 }
            );
        }

        const pool = await getDbConnection();

        // Check if organization exists
        const existsResult = await pool.query(
            `SELECT id FROM OrganizacijaProceneRizika WHERE pravnoLiceId = $1`,
            [pravnoLiceId]
        );

        let organizacijaId;

        if (existsResult.rows.length > 0) {
            // Update existing
            organizacijaId = existsResult.rows[0].id;
            await pool.query(
                `UPDATE OrganizacijaProceneRizika SET
          poslovno_ime = $1,
          adresa_sediste = $2,
          maticni_broj = $3,
          pib = $4,
          broj_licence = $5,
          menadzer_ime = $6,
          menadzer_licence = $7,
          updatedAt = GETDATE()
        WHERE pravnoLiceId = $8`,
                [
                    data.organizacija.poslovno_ime,
                    data.organizacija.adresa_sediste,
                    data.organizacija.maticni_broj,
                    data.organizacija.pib,
                    data.organizacija.broj_licence,
                    data.organizacija.menadzer_ime,
                    data.organizacija.menadzer_licence,
                    pravnoLiceId
                ]
            );
        } else {
            // Insert new – koristi OUTPUT INSERTED.id za pouzdano dobijanje ID-ja
            const insertResult = await pool.query<{ id: number }>(
                `INSERT INTO OrganizacijaProceneRizika (
                    pravnoLiceId, poslovno_ime, adresa_sediste, maticni_broj, pib, 
                    broj_licence, menadzer_ime, menadzer_licence
                 )
                 OUTPUT INSERTED.id
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    pravnoLiceId,
                    data.organizacija.poslovno_ime,
                    data.organizacija.adresa_sediste,
                    data.organizacija.maticni_broj,
                    data.organizacija.pib,
                    data.organizacija.broj_licence,
                    data.organizacija.menadzer_ime,
                    data.organizacija.menadzer_licence
                ]
            );
            organizacijaId = insertResult.rows[0]?.id;
        }

        // Fetch the organization
        const orgResult = await pool.query(
            `SELECT * FROM OrganizacijaProceneRizika WHERE id = $1`,
            [organizacijaId]
        );
        const organizacija = orgResult.rows[0];

        // Obriši postojeće članove tima
        await pool.query(
            `DELETE FROM ClanoviTimaProceneRizika WHERE organizacijaId = $1`,
            [organizacija.id]
        );

        // Dodaj nove članove tima
        if (data.clanoviTima && data.clanoviTima.length > 0) {
            for (let i = 0; i < data.clanoviTima.length; i++) {
                const clan = data.clanoviTima[i];
                await pool.query(
                    `INSERT INTO ClanoviTimaProceneRizika (organizacijaId, ime, broj_licence, redni_broj)
           VALUES ($1, $2, $3, $4)`,
                    [organizacija.id, clan.ime, clan.broj_licence, i + 1]
                );
            }
        }

        // Učitaj sve članove
        const clanoviResult = await pool.query(
            `SELECT * FROM ClanoviTimaProceneRizika 
       WHERE organizacijaId = $1 
       ORDER BY redni_broj`,
            [organizacija.id]
        );

        return NextResponse.json({
            success: true,
            organizacija,
            clanoviTima: clanoviResult.rows
        });
    } catch (error) {
        console.error('Greška pri čuvanju podataka o organizaciji:', error);
        return NextResponse.json(
            { error: 'Greška pri čuvanju podataka' },
            { status: 500 }
        );
    }
}
