import { NextRequest, NextResponse } from 'next/server';
import { PrilogMData, normalizePrilogMRow, primeniRucnuIzmenu } from '../../../../data/riskDataLoader';
import { getDbConnection } from '../../../../../lib/db';
import { executeWithRetry } from '../../../../../lib/db-retry';
import { ProcenaRouteContext } from '../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);
    const prilogMItem: PrilogMData = await request.json();

    // Validacija podataka
    if (!prilogMItem.id || !prilogMItem.groupId || prilogMItem.velicinaOpasnosti === null) {
      return NextResponse.json(
        { error: 'Nedostaju obavezni podaci' },
        { status: 400 }
      );
    }

    // Osnovna validacija podataka
    if (prilogMItem.velicinaOpasnosti && (prilogMItem.velicinaOpasnosti < 1 || prilogMItem.velicinaOpasnosti > 5)) {
      return NextResponse.json(
        { error: 'Veličina opasnosti mora biti između 1 i 5' },
        { status: 400 }
      );
    }

    // SŠ i VMŠ izračunava klijent iz stvarnih finansijskih podataka i Priloga B1
    const brojIliNull = (vrednost: unknown) =>
      typeof vrednost === 'number' && Number.isFinite(vrednost) ? vrednost : null;

    await executeWithRetry(async () => {
      const pool = await getDbConnection();

      await pool.query(`
        INSERT INTO "PrilogM" (
          "procenaId", "itemId", "groupId", requirement, "velicinaOpasnosti", izlozenost, ranjivost,
          verovatnoca, steta, kriticnost, posledice, "nivoRizika", "kategorijaRizika", prihvatljivost,
          "stepenSS", "stepenVMSH", "vmshIznos", "opisIdentifikovanihRizika"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT ("procenaId", "itemId") DO UPDATE SET
          "groupId" = EXCLUDED."groupId", requirement = EXCLUDED.requirement,
          "velicinaOpasnosti" = EXCLUDED."velicinaOpasnosti", izlozenost = EXCLUDED.izlozenost,
          ranjivost = EXCLUDED.ranjivost, verovatnoca = EXCLUDED.verovatnoca, steta = EXCLUDED.steta,
          kriticnost = EXCLUDED.kriticnost, posledice = EXCLUDED.posledice,
          "nivoRizika" = EXCLUDED."nivoRizika", "kategorijaRizika" = EXCLUDED."kategorijaRizika",
          prihvatljivost = EXCLUDED.prihvatljivost, "stepenSS" = EXCLUDED."stepenSS",
          "stepenVMSH" = EXCLUDED."stepenVMSH", "vmshIznos" = EXCLUDED."vmshIznos",
          "opisIdentifikovanihRizika" = EXCLUDED."opisIdentifikovanihRizika", "updatedAt" = NOW()
      `, [
        procenaId,
        prilogMItem.id,
        prilogMItem.groupId,
        prilogMItem.requirement || '',
        prilogMItem.velicinaOpasnosti,
        prilogMItem.izlozenost,
        prilogMItem.ranjivost,
        prilogMItem.verovatnoca,
        prilogMItem.steta,
        prilogMItem.kriticnost,
        prilogMItem.posledice,
        prilogMItem.nivoRizika,
        prilogMItem.kategorijaRizika,
        prilogMItem.prihvatljivost,
        brojIliNull(prilogMItem.stepenSS),
        brojIliNull(prilogMItem.stepenVMSH),
        brojIliNull(prilogMItem.vmshIznos),
        prilogMItem.opisIdentifikovanihRizika || null
      ]);
    });

    console.log(`✅ Prilog M podatak sačuvan za procenu ${procenaId}:`, {
      id: prilogMItem.id,
      velicinaOpasnosti: prilogMItem.velicinaOpasnosti,
      nivoRizika: prilogMItem.nivoRizika,
      prihvatljivost: prilogMItem.prihvatljivost
    });

    return NextResponse.json({
      success: true,
      message: 'Prilog M podatak uspešno sačuvan',
      data: prilogMItem
    });

  } catch (error: unknown) {
    console.error('Greška pri čuvanju Prilog M podatka:', error);
    const err = error as Error;

    if (err.message === "Procena ne postoji") {
      return NextResponse.json({ error: "Procena ne postoji" }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Greška pri čuvanju podataka' },
      { status: 500 }
    );
  }
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
            itemId as id, groupId, requirement, velicinaOpasnosti, izlozenost, ranjivost,
            verovatnoca, steta, kriticnost, posledice, nivoRizika, kategorijaRizika, prihvatljivost,
            stepenSS, stepenVMSH, vmshIznos, opisIdentifikovanihRizika
          FROM PrilogM 
          WHERE procenaId = $1
          ORDER BY groupId, itemId
        `, [procenaId]);
      return result.rows;
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('Greška pri učitavanju Prilog M podataka:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

// Endpoint za dobijanje agregiranih statistika
export async function PATCH(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const updateData = await request.json();

    if (!procenaId || !itemId) {
      return NextResponse.json({ error: 'Nedostaju obavezni parametri' }, { status: 400 });
    }

    // Validacija polja
    const allowedFields = ['posledice', 'steta', 'opisIdentifikovanihRizika'];
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
      } else {
        // Za numerička polja (posledice, steta)
        if (typeof value !== 'number' || value < 1 || value > 5) {
          return NextResponse.json({
            error: `Vrednost za ${field} mora biti broj između 1 i 5`
          }, { status: 400 });
        }
      }
    }

    const updated = await executeWithRetry(async () => {
      const pool = await getDbConnection();

      // Proveri da li stavka postoji
      const existingRecord = await pool.query(
        'SELECT * FROM "PrilogM" WHERE "procenaId" = $1 AND "itemId" = $2',
        [procenaId, itemId]
      );

      if (existingRecord.rows.length === 0) {
        // Stavka ne postoji - ovo znači da rizik nije još uvek procenjen
        // Umesto da bacamo grešku, jednostavno ne radimo ništa za opisIdentifikovanihRizika
        if (updateFields.includes('opisIdentifikovanihRizika')) {
          console.log(`⚠️ Pokušaj ažuriranja opisa za nepostojećу stavku ${itemId} - preskačemo`);
          return null; // Izađi iz funkcije bez greške
        } else {
          throw new Error('Stavka ne postoji');
        }
      }

      const columns: Record<string, unknown> = {};
      if (updateFields.includes('opisIdentifikovanihRizika')) {
        columns.opisIdentifikovanihRizika = updateData.opisIdentifikovanihRizika;
      }

      // Ručna izmena štete (kol. 7) ili posledica (kol. 9): preračunaj posledice,
      // nivo rizika, kategoriju i prihvatljivost da tabela ostane u skladu sa O.2, P.1 i P.2
      let item = normalizePrilogMRow(existingRecord.rows[0]);
      for (const field of ['steta', 'posledice'] as const) {
        if (updateFields.includes(field)) {
          item = { ...item, ...primeniRucnuIzmenu(item, field, updateData[field]) };
        }
      }
      if (updateFields.includes('steta') || updateFields.includes('posledice')) {
        Object.assign(columns, {
          steta: item.steta,
          posledice: item.posledice,
          nivoRizika: item.nivoRizika,
          kategorijaRizika: item.kategorijaRizika,
          prihvatljivost: item.prihvatljivost
        });
      }

      const names = Object.keys(columns);
      const setClause = names.map((name, index) => `"${name}" = $${index + 3}`).join(', ');
      await pool.query(`
        UPDATE "PrilogM"
        SET ${setClause}, "updatedAt" = NOW()
        WHERE "procenaId" = $1 AND "itemId" = $2
      `, [procenaId, itemId, ...names.map(name => columns[name])]);

      return columns;
    });

    console.log(`✅ Ažurirano polje/polja za stavku ${itemId}:`, updated);

    return NextResponse.json({
      success: true,
      message: 'Stavka uspešno ažurirana',
      updatedFields: updateFields,
      item: updated
    });

  } catch (error: unknown) {
    console.error('Greška pri ažuriranju stavke:', error);
    const err = error as Error;

    if (err.message === 'Stavka ne postoji') {
      return NextResponse.json({ error: 'Stavka ne postoji' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Greška pri ažuriranju stavke' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
            itemId as id, groupId, requirement, velicinaOpasnosti, izlozenost, ranjivost,
            verovatnoca, steta, kriticnost, posledice, nivoRizika, kategorijaRizika, prihvatljivost,
            stepenSS, stepenVMSH, vmshIznos, opisIdentifikovanihRizika
          FROM PrilogM 
          WHERE procenaId = $1
          ORDER BY groupId, itemId
        `, [procenaId]);
      return result.rows;
    });

    // Izračunaj statistike
    const totalItems = data.length;
    const riskCategories = {
      1: data.filter(item => item.kategorijaRizika === 1).length, // PRVA - izrazito veliki
      2: data.filter(item => item.kategorijaRizika === 2).length, // DRUGA - veliki
      3: data.filter(item => item.kategorijaRizika === 3).length, // TREĆA - umereno veliki
      4: data.filter(item => item.kategorijaRizika === 4).length, // ČETVRTA - mali
      5: data.filter(item => item.kategorijaRizika === 5).length  // PETA - vrlo mali
    };

    const prihvatljiviRizici = data.filter(item => item.prihvatljivost === 'PRIHVATLJIV').length;
    const neprihvatljiviRizici = data.filter(item => item.prihvatljivost === 'NEPRIHVATLJIV').length;

    const statistics = {
      totalItems,
      riskCategories,
      prihvatljiviRizici,
      neprihvatljiviRizici,
      completionPercentage: totalItems > 0 ? 100 : 0, // Ako imamo podatke, znači da je završeno
      highRiskItems: riskCategories[1] + riskCategories[2], // PRVA + DRUGA kategorija
      averageRiskLevel: totalItems > 0
        ? Math.round(data.reduce((sum, item) => sum + (Number(item.nivoRizika) || 0), 0) / totalItems * 100) / 100
        : 0
    };

    return NextResponse.json({
      data,
      statistics
    });

  } catch (error) {
    console.error('Greška pri računanju statistika:', error);
    return NextResponse.json(
      { error: 'Greška pri računanju statistika' },
      { status: 500 }
    );
  }
}
