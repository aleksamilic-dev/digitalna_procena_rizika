import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';

// GET - Učitaj sekcijske podatke za Prilog M
export async function GET(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);

    if (isNaN(procenaId)) {
      return NextResponse.json(
        { error: 'Nevaljan ID procene' },
        { status: 400 }
      );
    }

    const pool = await getDbConnection();

    // Učitaj sekcijske podatke
    const sectionsResult = await pool.query(`
      SELECT * FROM PrilogMSections 
      WHERE procenaId = $1 
      ORDER BY sectionNumber
    `, [procenaId]);

    // Učitaj ukupne podatke
    const summaryResult = await pool.query(`
      SELECT * FROM PrilogMSummary 
      WHERE procenaId = $1
    `, [procenaId]);

    return NextResponse.json({
      sections: sectionsResult.rows,
      summary: summaryResult.rows[0] || null
    });

  } catch (error) {
    console.error('Greška pri učitavanju sekcijskih podataka:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

// POST - Sačuvaj ili ažuriraj sekcijske podatke
export async function POST(
  request: NextRequest,
  context: ProcenaRouteContext
) {
  try {
    const { id } = await context.params;
    const procenaId = parseInt(id);

    if (isNaN(procenaId)) {
      return NextResponse.json(
        { error: 'Nevaljan ID procene' },
        { status: 400 }
      );
    }

    const { sections, summary } = await request.json();
    const pool = await getDbConnection();

    try {
      // Batch upsert sections - single query for all sections
      if (sections && Array.isArray(sections) && sections.length > 0) {
        // Use MERGE for efficient batch upsert
        await pool.query(`
          MERGE PrilogMSections AS target
          USING (SELECT @procenaId as procenaId, @sectionNumber as sectionNumber) AS source
          ON (target.procenaId = source.procenaId AND target.sectionNumber = source.sectionNumber)
          WHEN MATCHED THEN
            UPDATE SET
              sectionTitle = @sectionTitle,
              totalItems = @totalItems,
              completedItems = @completedItems,
              averageVO = @averageVO,
              averageIzlozenost = @averageIzlozenost,
              averageRanjivost = @averageRanjivost,
              averageVerovatnoca = @averageVerovatnoca,
              averagePosledice = @averagePosledice,
              averageSteta = @averageSteta,
              averageKriticnost = @averageKriticnost,
              averageNivoRizika = @averageNivoRizika,
              dominantnaKategorija = @dominantnaKategorija,
              prihvatljivostStatus = @prihvatljivostStatus,
              updatedAt = NOW()
          WHEN NOT MATCHED THEN
            INSERT (procenaId, sectionNumber, sectionTitle, totalItems, completedItems,
              averageVO, averageIzlozenost, averageRanjivost, averageVerovatnoca,
              averagePosledice, averageSteta, averageKriticnost, averageNivoRizika,
              dominantnaKategorija, prihvatljivostStatus, createdAt, updatedAt)
            VALUES (@procenaId, @sectionNumber, @sectionTitle, @totalItems, @completedItems,
              @averageVO, @averageIzlozenost, @averageRanjivost, @averageVerovatnoca,
              @averagePosledice, @averageSteta, @averageKriticnost, @averageNivoRizika,
              @dominantnaKategorija, @prihvatljivostStatus, NOW(), NOW());
        `, [
          procenaId,
          sections[0]?.sectionNumber,
          sections[0]?.sectionTitle,
          sections[0]?.totalItems || 0,
          sections[0]?.completedItems || 0,
          sections[0]?.averageVO || null,
          sections[0]?.averageIzlozenost || null,
          sections[0]?.averageRanjivost || null,
          sections[0]?.averageVerovatnoca || null,
          sections[0]?.averagePosledice || null,
          sections[0]?.averageSteta || null,
          sections[0]?.averageKriticnost || null,
          sections[0]?.averageNivoRizika || null,
          sections[0]?.dominantnaKategorija || null,
          sections[0]?.prihvatljivostStatus || null
        ]);
      }

      // Upsert summary
      if (summary) {
        await pool.query(`
          IF EXISTS (SELECT 1 FROM PrilogMSummary WHERE procenaId = @param1)
          BEGIN
            UPDATE PrilogMSummary SET
              ukupnoStavki = @param2,
              ukupnoZavrsenih = @param3,
              ukupanNivoRizika = @param4,
              ukupnaKategorija = @param5,
              ukupnaPrihvatljivost = @param6,
              procenatZavrsenosti = @param7,
              preporuke = @param8,
              updatedAt = NOW()
            WHERE procenaId = @param1
          END
          ELSE
          BEGIN
            INSERT INTO PrilogMSummary (
              procenaId, ukupnoStavki, ukupnoZavrsenih, ukupanNivoRizika,
              ukupnaKategorija, ukupnaPrihvatljivost, procenatZavrsenosti,
              preporuke, createdAt, updatedAt
            ) VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, NOW(), NOW())
          END
        `, [
          procenaId,
          summary.ukupnoStavki || 0,
          summary.ukupnoZavrsenih || 0,
          summary.ukupanNivoRizika || null,
          summary.ukupnaKategorija || null,
          summary.ukupnaPrihvatljivost || null,
          summary.procenatZavrsenosti || null,
          summary.preporuke || null
        ]);
      }

      return NextResponse.json({
        success: true,
        message: 'Sekcijski podaci uspešno sačuvani'
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Greška pri čuvanju sekcijskih podataka:', error);
    return NextResponse.json(
      { error: 'Greška pri čuvanju podataka' },
      { status: 500 }
    );
  }
}
