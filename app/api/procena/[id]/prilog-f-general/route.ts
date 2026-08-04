import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/db';
import { ProcenaRouteContext } from '../../../types';

export async function GET(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const pool = await getDbConnection();

        const result = await pool.query(
            'SELECT * FROM prilog_f_data WHERE procena_id = $1',
            [procenaId]
        );

        return NextResponse.json({
            fData: result.rows[0] || null
        });

    } catch (error) {
        console.error('Error fetching Prilog F data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: ProcenaRouteContext
) {
    try {
        const { params } = context;
        const { id: procenaId } = await params;
        const body = await request.json();
        const pool = await getDbConnection();

        const existingResult = await pool.query(
            'SELECT id FROM prilog_f_data WHERE procena_id = $1',
            [procenaId]
        );

        if (existingResult.rows.length > 0) {
            await pool.query(
                `UPDATE prilog_f_data
                 SET f1_podaci_o_organizaciji = $1,
                     f1_menadzer_rizika = $2,
                     f2_podaci_o_posmatranoj_org = $3,
                     f2_sifra_delatnosti = $4,
                     f2_odgovorno_lice = $5,
                     f2_podaci_o_licima = $6,
                     f3_eksterni_kontekst = $7,
                     f3_interni_kontekst = $8,
                     f4_identifikacija = $9,
                     f4_analiza = $10,
                     f4_vrednovanje = $11,
                     f6_zakljucak = $12,
                     updated_at = NOW()
                 WHERE procena_id = $13`,
                [
                    body.f1_podaci_o_organizaciji,
                    body.f1_menadzer_rizika,
                    body.f2_podaci_o_posmatranoj_org,
                    body.f2_sifra_delatnosti,
                    body.f2_odgovorno_lice,
                    body.f2_podaci_o_licima,
                    JSON.stringify(body.f3_eksterni_kontekst),
                    JSON.stringify(body.f3_interni_kontekst),
                    JSON.stringify(body.f4_identifikacija),
                    JSON.stringify(body.f4_analiza),
                    JSON.stringify(body.f4_vrednovanje),
                    JSON.stringify(body.f6_zakljucak),
                    procenaId
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO prilog_f_data (
                    procena_id, 
                    f1_podaci_o_organizaciji, f1_menadzer_rizika,
                    f2_podaci_o_posmatranoj_org, f2_sifra_delatnosti, f2_odgovorno_lice, f2_podaci_o_licima,
                    f3_eksterni_kontekst, f3_interni_kontekst,
                    f4_identifikacija, f4_analiza, f4_vrednovanje,
                    f6_zakljucak,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
                [
                    procenaId,
                    body.f1_podaci_o_organizaciji,
                    body.f1_menadzer_rizika,
                    body.f2_podaci_o_posmatranoj_org,
                    body.f2_sifra_delatnosti,
                    body.f2_odgovorno_lice,
                    body.f2_podaci_o_licima,
                    JSON.stringify(body.f3_eksterni_kontekst),
                    JSON.stringify(body.f3_interni_kontekst),
                    JSON.stringify(body.f4_identifikacija),
                    JSON.stringify(body.f4_analiza),
                    JSON.stringify(body.f4_vrednovanje),
                    JSON.stringify(body.f6_zakljucak)
                ]
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error saving Prilog F data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
