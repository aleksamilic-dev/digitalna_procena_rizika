import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';

export async function POST(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);
    const financialData = await request.json();

    const pool = await getDbConnection();

    // Proveri da li procena postoji
    const procenaCheck = await pool.query('SELECT id FROM ProcenaRizika WHERE id = $1', [procenaId]);
    if (procenaCheck.rows.length === 0) {
      return NextResponse.json({ error: "Procena ne postoji" }, { status: 404 });
    }

    const existingFinancialData = await pool.query(
      'SELECT id FROM FinancialData WHERE procenaId = $1',
      [procenaId]
    );

    if (existingFinancialData.rows.length > 0) {
      await pool.query(`
        UPDATE FinancialData
        SET poslovniPrihodi = $1,
            vrednostImovine = $2,
            delatnost = $3,
            stvarnaSteta = $4,
            updatedAt = NOW()
        WHERE procenaId = $5
      `, [
        financialData.poslovniPrihodi,
        financialData.vrednostImovine,
        financialData.delatnost,
        financialData.stvarnaSteta,
        procenaId
      ]);
    } else {
      await pool.query(`
        INSERT INTO FinancialData (
          procenaId,
          poslovniPrihodi,
          vrednostImovine,
          delatnost,
          stvarnaSteta,
          createdAt,
          updatedAt
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        procenaId,
        financialData.poslovniPrihodi,
        financialData.vrednostImovine,
        financialData.delatnost,
        financialData.stvarnaSteta
      ]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Greška pri čuvanju finansijskih podataka:', error);
    return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);

    const pool = await getDbConnection();

    const result = await pool.query(`
      SELECT poslovniPrihodi, vrednostImovine, delatnost, stvarnaSteta
      FROM FinancialData 
      WHERE procenaId = $1
    `, [procenaId]);

    if (result.rows.length === 0) {
      // Vrati prazne vrednosti ako nema podataka
      return NextResponse.json({
        poslovniPrihodi: 0,
        vrednostImovine: 0,
        delatnost: 'default',
        stvarnaSteta: 0
      });
    }

    // Azure SQL column names are case-sensitive
    const data = result.rows[0] as {
      poslovniPrihodi?: number | string;
      vrednostImovine?: number | string;
      delatnost?: string;
      stvarnaSteta?: number | string;
    };
    
    return NextResponse.json({
      poslovniPrihodi: typeof data.poslovniPrihodi === 'number' ? data.poslovniPrihodi : parseInt(String(data.poslovniPrihodi || '0')),
      vrednostImovine: typeof data.vrednostImovine === 'number' ? data.vrednostImovine : parseInt(String(data.vrednostImovine || '0')),
      delatnost: data.delatnost || 'default',
      stvarnaSteta: typeof data.stvarnaSteta === 'number' ? data.stvarnaSteta : parseInt(String(data.stvarnaSteta || '0'))
    });

  } catch (error) {
    console.error('Greška pri učitavanju finansijskih podataka:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju podataka' }, { status: 500 });
  }
}
