import { NextResponse } from "next/server";
import { getDbConnection } from "../../../../../lib/db";
import { executeWithRetry } from "../../../../../lib/db-retry";

export async function OPTIONS() {
    return new NextResponse(null, { status: 200 });
}

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const procenaId = parseInt(id);
        const { risk_id, danger_level, description } = await req.json();

        if (!procenaId || !risk_id || !danger_level) {
            return NextResponse.json({ error: "Nedostaju potrebni podaci" }, { status: 400 });
        }

        await executeWithRetry(async () => {
            const pool = await getDbConnection();

            // Proveri da li procena postoji
            const procenaCheck = await pool.query('SELECT id FROM ProcenaRizika WHERE id = $1', [procenaId]);
            if (procenaCheck.rows.length === 0) {
                throw new Error("Procena ne postoji");
            }

            // Proveri da li već postoji selekcija za ovaj rizik
            const existingSelection = await pool.query(
                'SELECT id FROM RiskSelection WHERE procenaId = $1 AND riskId = $2',
                [procenaId, risk_id]
            );

            if (existingSelection.rows.length > 0) {
                // Ažuriraj postojeći zapis — NOW() umesto CURRENT_TIMESTAMP (Azure SQL)
                await pool.query(`
                    UPDATE RiskSelection
                    SET dangerLevel = $1, description = $2, updatedAt = NOW()
                    WHERE procenaId = $3 AND riskId = $4
                `, [danger_level, description || '', procenaId, risk_id]);
            } else {
                // Kreiraj novi zapis — NOW() umesto CURRENT_TIMESTAMP (Azure SQL)
                await pool.query(`
                    INSERT INTO RiskSelection (procenaId, riskId, dangerLevel, description, createdAt, updatedAt)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                `, [procenaId, risk_id, danger_level, description || '']);
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Greška pri čuvanju selekcije rizika:", error);
        const err = error as Error;

        if (err.message === "Procena ne postoji") {
            return NextResponse.json({ error: "Procena ne postoji" }, { status: 404 });
        }

        return NextResponse.json({ error: "Greška pri čuvanju podataka" }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const procenaId = parseInt(id);

        if (!procenaId) {
            return NextResponse.json({ error: "Nevaljan ID procene" }, { status: 400 });
        }

        const result = await executeWithRetry(async () => {
            const pool = await getDbConnection();
            return await pool.query('SELECT * FROM RiskSelection WHERE procenaId = $1', [procenaId]);
        });

        // Mapiranje naziva kolona (Azure SQL može vraćati lowercase)
        const mappedRows = result.rows.map(row => ({
            riskId: row.riskid || row.riskId,
            dangerLevel: row.dangerlevel || row.dangerLevel,
            description: row.description || ''
        }));

        return NextResponse.json(mappedRows);
    } catch (error) {
        console.error("Greška pri dohvatanju selekcija rizika:", error);
        return NextResponse.json({ error: "Greška pri dohvatanju podataka" }, { status: 500 });
    }
}
