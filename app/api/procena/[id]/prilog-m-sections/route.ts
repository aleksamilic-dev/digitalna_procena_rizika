import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';

export async function GET(_request: NextRequest, context: ProcenaRouteContext) {
  try {
    const { id } = await context.params;
    const procenaId = Number(id);
    if (!Number.isInteger(procenaId)) return NextResponse.json({ error: 'Nevaljan ID procene' }, { status: 400 });
    const pool = await getDbConnection();
    const [sections, summary] = await Promise.all([
      pool.query('SELECT * FROM "PrilogMSections" WHERE "procenaId" = $1 ORDER BY "sectionNumber"', [procenaId]),
      pool.query('SELECT * FROM "PrilogMSummary" WHERE "procenaId" = $1', [procenaId]),
    ]);
    return NextResponse.json({ sections: sections.rows, summary: summary.rows[0] || null });
  } catch (error) {
    console.error('Greška pri učitavanju sekcijskih podataka:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju podataka' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: ProcenaRouteContext) {
  try {
    const { id } = await context.params;
    const procenaId = Number(id);
    if (!Number.isInteger(procenaId)) return NextResponse.json({ error: 'Nevaljan ID procene' }, { status: 400 });
    const { sections = [], summary } = await request.json();
    const pool = await getDbConnection();
    for (const section of Array.isArray(sections) ? sections : []) {
      await pool.query(`INSERT INTO "PrilogMSections" ("procenaId", "sectionNumber", "sectionTitle", "totalItems", "completedItems", "averageVO", "averageIzlozenost", "averageRanjivost", "averageVerovatnoca", "averagePosledice", "averageSteta", "averageKriticnost", "averageNivoRizika", "dominantnaKategorija", "prihvatljivostStatus") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT ("procenaId", "sectionNumber") DO UPDATE SET "sectionTitle"=EXCLUDED."sectionTitle", "totalItems"=EXCLUDED."totalItems", "completedItems"=EXCLUDED."completedItems", "averageVO"=EXCLUDED."averageVO", "averageIzlozenost"=EXCLUDED."averageIzlozenost", "averageRanjivost"=EXCLUDED."averageRanjivost", "averageVerovatnoca"=EXCLUDED."averageVerovatnoca", "averagePosledice"=EXCLUDED."averagePosledice", "averageSteta"=EXCLUDED."averageSteta", "averageKriticnost"=EXCLUDED."averageKriticnost", "averageNivoRizika"=EXCLUDED."averageNivoRizika", "dominantnaKategorija"=EXCLUDED."dominantnaKategorija", "prihvatljivostStatus"=EXCLUDED."prihvatljivostStatus", "updatedAt"=NOW()`, [procenaId, section.sectionNumber, section.sectionTitle || null, section.totalItems || 0, section.completedItems || 0, section.averageVO ?? null, section.averageIzlozenost ?? null, section.averageRanjivost ?? null, section.averageVerovatnoca ?? null, section.averagePosledice ?? null, section.averageSteta ?? null, section.averageKriticnost ?? null, section.averageNivoRizika ?? null, section.dominantnaKategorija ?? null, section.prihvatljivostStatus ?? null]);
    }
    if (summary) await pool.query(`INSERT INTO "PrilogMSummary" ("procenaId", "ukupnoStavki", "ukupnoZavrsenih", "ukupanNivoRizika", "ukupnaKategorija", "ukupnaPrihvatljivost", "procenatZavrsenosti", preporuke) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT ("procenaId") DO UPDATE SET "ukupnoStavki"=EXCLUDED."ukupnoStavki", "ukupnoZavrsenih"=EXCLUDED."ukupnoZavrsenih", "ukupanNivoRizika"=EXCLUDED."ukupanNivoRizika", "ukupnaKategorija"=EXCLUDED."ukupnaKategorija", "ukupnaPrihvatljivost"=EXCLUDED."ukupnaPrihvatljivost", "procenatZavrsenosti"=EXCLUDED."procenatZavrsenosti", preporuke=EXCLUDED.preporuke, "updatedAt"=NOW()`, [procenaId, summary.ukupnoStavki || 0, summary.ukupnoZavrsenih || 0, summary.ukupanNivoRizika ?? null, summary.ukupnaKategorija ?? null, summary.ukupnaPrihvatljivost ?? null, summary.procenatZavrsenosti ?? null, summary.preporuke ?? null]);
    return NextResponse.json({ success: true, message: 'Sekcijski podaci uspešno sačuvani' });
  } catch (error) {
    console.error('Greška pri čuvanju sekcijskih podataka:', error);
    return NextResponse.json({ error: 'Greška pri čuvanju podataka' }, { status: 500 });
  }
}
