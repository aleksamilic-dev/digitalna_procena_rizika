import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { executeWithRetry } from '../../../../../lib/db-retry';
import { ProcenaRouteContext } from '../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function GET(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);

    if (!procenaId) {
      return NextResponse.json({ error: 'Nevaljan ID procene' }, { status: 400 });
    }

    const data = await executeWithRetry(async () => {
      const pool = await getDbConnection();

      const result = await pool.query(`
          SELECT 
            sectionId as "sectionId", 
            groupId as "groupId", 
            sectionName as "sectionName", 
            itemCount as "itemCount", 
            averageVO as "averageVO", 
            opisIdentifikovanihRizika as "opisIdentifikovanihRizika"
          FROM PrilogLj 
          WHERE procenaId = $1
          ORDER BY groupId, sectionId
        `, [procenaId]);
      return result.rows;
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Greška pri učitavanju Prilog Lj podataka:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);
    const url = new URL(request.url);
    const sectionId = url.searchParams.get('sectionId');
    const updateData = await request.json();

    if (!procenaId || !sectionId) {
      return NextResponse.json({ error: 'Nedostaju obavezni parametri' }, { status: 400 });
    }

    // Validacija polja
    const allowedFields = ['opisIdentifikovanihRizika'];
    const updateFields = Object.keys(updateData).filter(field => allowedFields.includes(field));

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nema validnih polja za ažuriranje' }, { status: 400 });
    }

    // Validacija vrednosti
    for (const field of updateFields) {
      const value = updateData[field];
      if (field === 'opisIdentifikovanihRizika') {
        // Za opis, proveravamo da li je string
        if (typeof value !== 'string') {
          return NextResponse.json({
            error: `Vrednost za ${field} mora biti tekst`
          }, { status: 400 });
        }
      }
    }

    await executeWithRetry(async () => {
      const pool = await getDbConnection();

      // Proveri da li sekcija postoji
      const existingRecord = await pool.query(
        'SELECT * FROM PrilogLj WHERE procenaId = $1 AND sectionId = $2',
        [procenaId, sectionId]
      );

      if (existingRecord.rows.length === 0) {
        // Sekcija ne postoji - kreiraj je
        await pool.query(`
          INSERT INTO PrilogLj (procenaId, sectionId, groupId, sectionName, itemCount, averageVO, opisIdentifikovanihRizika, createdAt, updatedAt)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          procenaId,
          sectionId,
          'default', // groupId - možeš proširiti logiku
          `Sekcija ${sectionId}`,
          0, // itemCount - možeš izračunati
          0, // averageVO - možeš izračunati
          updateData.opisIdentifikovanihRizika
        ]);
      } else {
        // Sekcija postoji - ažuriraj je
        const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
        const values = [procenaId, sectionId, ...updateFields.map(field => updateData[field])];

        const query = `
          UPDATE PrilogLj 
          SET ${setClause}, updatedAt = NOW()
          WHERE procenaId = $1 AND sectionId = $2
        `;

        await pool.query(query, values);
      }
    });

    console.log(`✅ Ažurirano Prilog Lj za sekciju ${sectionId}:`, updateData);

    return NextResponse.json({
      success: true,
      message: 'Prilog Lj uspešno ažuriran',
      updatedFields: updateFields
    });

  } catch (error: unknown) {
    console.error('Greška pri ažuriranju Prilog Lj:', error);

    return NextResponse.json(
      { error: 'Greška pri ažuriranju Prilog Lj' },
      { status: 500 }
    );
  }
}
