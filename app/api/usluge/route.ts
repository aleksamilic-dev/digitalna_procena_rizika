import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';
import { handleApiError } from '../../../lib/api-error';

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID usluge je obavezan" }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.query('DELETE FROM Usluge WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Usluga nije pronađena" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Usluga je uspešno obrisana" });
    } catch (error) {
        return handleApiError(error, "brisanje usluge");
    }
}

export async function PUT(req: Request) {
    try {
        const { id, naziv_usluge, datum_izrade, opis } = await req.json();

        if (!id || !naziv_usluge) {
            return NextResponse.json({ error: "ID usluge i naziv usluge su obavezni" }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.query(`
            UPDATE Usluge 
            SET naziv_usluge = $1, datum_izrade = $2, opis = $3, updatedAt = NOW()
            WHERE id = $4
        `, [naziv_usluge, datum_izrade, opis, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Usluga nije pronađena" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Usluga je uspešno ažurirana" });
    } catch (error) {
        return handleApiError(error, "ažuriranje usluge");
    }
}