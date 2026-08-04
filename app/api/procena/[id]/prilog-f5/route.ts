import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
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
            'SELECT * FROM tabela_f5 WHERE procena_id = $1 ORDER BY group_id, id',
            [procenaId]
        );

        return NextResponse.json(result.rows);

    } catch (error) {
        console.error('Error fetching Prilog F5 data:', error);
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

        if (body.action === 'delete') {
            await pool.query(
                'DELETE FROM tabela_f5 WHERE id = $1 AND procena_id = $2',
                [body.id, procenaId]
            );
            return NextResponse.json({ success: true, deletedId: body.id });
        } else {
            // Insert or Update
            if (body.id) {
                await pool.query(
                    `UPDATE tabela_f5 
                     SET mera = $1, opis_i_obrazlozenje = $2, updated_at = NOW()
                     WHERE id = $3 AND procena_id = $4`,
                    [body.mera, body.opis_i_obrazlozenje, body.id, procenaId]
                );
                return NextResponse.json({ success: true, id: body.id });
            } else {
                const insertResult = await pool.query<{ id: number }>(
                    `INSERT INTO tabela_f5 (procena_id, group_id, mera, opis_i_obrazlozenje) 
                     VALUES ($1, $2, $3, $4)
                     RETURNING id`,
                    [procenaId, body.group_id, body.mera || '', body.opis_i_obrazlozenje || '']
                );
                return NextResponse.json({ success: true, id: insertResult.rows[0].id });
            }
        }

    } catch (error) {
        console.error('Error saving Prilog F5 data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
