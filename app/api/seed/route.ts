import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db";

const GRUPE = [
    "Organizacija i rukovodstvo",
    "Radno okruženje",
    "Radni procesi",
    "Tehnička sredstva",
    "Fizička sigurnost",
    "Zdravlje na radu",
    "Ekologija",
    "Informaciona sigurnost",
    "Pravna usklađenost",
    "Finansijski rizici",
    "Reputacioni rizici"
];

export async function POST() {
    // Disable in production for security
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Endpoint disabled in production' },
            { status: 403 }
        );
    }

    try {
        const pool = await getDbConnection();
        
        // Create GrupaRizika table if it doesn't exist
        await pool.query(`
            IF OBJECT_ID('GrupaRizika', 'U') IS NULL
            BEGIN
                CREATE TABLE GrupaRizika (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    naziv NVARCHAR(255) NOT NULL,
                    redosled INT NOT NULL,
                    createdAt DATETIME2 DEFAULT CURRENT_TIMESTAMP
                )
            END
        `);
        
        // First delete existing groups
        await pool.query('DELETE FROM GrupaRizika');
        console.log('🗑️ Cleared existing risk groups');
        
        // Create new groups
        for (let i = 0; i < GRUPE.length; i++) {
            await pool.query('INSERT INTO GrupaRizika (naziv, redosled) VALUES ($1, $2)', [GRUPE[i], i + 1]);
        }
        
        console.log('✔️ Seeded 11 risk groups successfully!');
        
        // Verify the data
        const result = await pool.query('SELECT COUNT(*) as count FROM GrupaRizika');
        console.log(`📊 Total risk groups in database: ${result.rows[0].count}`);
        
        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${GRUPE.length} risk groups`,
            count: result.rows[0].count
        });
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
