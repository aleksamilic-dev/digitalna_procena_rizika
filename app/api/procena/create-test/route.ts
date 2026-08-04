import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../lib/db';

export async function POST() {
    try {
        const pool = await getDbConnection();
        
        // Create a test legal entity first
        const existingPravnoLice = await pool.query('SELECT id FROM "PravnoLice" WHERE pib = $1', ['123456789']);
        
        let pravnoLiceId;
        if (existingPravnoLice.rows.length > 0) {
            pravnoLiceId = existingPravnoLice.rows[0].id;
        } else {
            const pravnoLiceResult = await pool.query(`
                INSERT INTO "PravnoLice" (naziv, pib, adresa, telefon, email)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['Test Kompanija d.o.o.', '123456789', 'Test adresa 123, Beograd', '+381 11 123 4567', 'test@test.com']);
            pravnoLiceId = pravnoLiceResult.rows[0].id;
        }
        
        // Get the admin user ID
        const adminUser = await pool.query('SELECT id FROM korisnici WHERE je_admin = TRUE ORDER BY id LIMIT 1');
            
        if (adminUser.rows.length === 0) {
            throw new Error('No admin user found. Please ensure the database is properly initialized.');
        }
        
        // Create a test risk assessment
        const procenaResult = await pool.query(`
            INSERT INTO "ProcenaRizika" (naziv, opis, status, "pravnoLiceId", "korisnikId")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, ['Test Procena Rizika', 'Ovo je test procena rizika kreirana automatski za testiranje sistema', 'u_toku', pravnoLiceId, adminUser.rows[0].id]);
        const procenaId = procenaResult.rows[0].id;
        
        return NextResponse.json({
            success: true,
            message: 'Test risk assessment created successfully',
            data: {
                procenaId,
                pravnoLiceId,
                testUrl: `/optimized-risk/${procenaId}`
            }
        });
        
    } catch (error) {
        console.error('Failed to create test risk assessment:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create test risk assessment',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
