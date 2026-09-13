/**
 * Прави нову, празну базу са истом шемом као постојећа и (опционо) преноси
 * само изабране табеле из бекапа — нпр. налоге корисника.
 *
 * Постојећа база се НЕ дира; остаје нетакнута као резервна копија.
 *
 * Покретање:
 *   npx tsx scripts/db-init-clean.ts --name=procena_rizika --schema=backups/<ts>/schema.sql \
 *       --data=backups/<ts>/data.json --seed=korisnici
 *       # без --apply само исписује шта би урадило
 *   ... --apply        # стварно креира
 *   ... --drop --apply # прво брише постојећу базу тог имена (опрезно!)
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env.production', quiet: true });
dotenv.config({ quiet: true });

import * as fs from 'fs';
import { Client } from 'pg';

const arg = (name: string) => {
    const a = process.argv.find((x) => x.startsWith(`--${name}=`));
    return a ? a.slice(name.length + 3) : undefined;
};
const flag = (name: string) => process.argv.includes(`--${name}`);

const ADMIN_URL = arg('url') ?? process.env.DATABASE_URL;
const NEW_DB = arg('name');
const SCHEMA = arg('schema');
const DATA = arg('data');
const SEED = (arg('seed') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const APPLY = flag('apply');
const DROP = flag('drop');

if (!ADMIN_URL || !NEW_DB || !SCHEMA) {
    console.error('Употреба: --name=<нова_база> --schema=<schema.sql> [--data=<data.json> --seed=t1,t2] [--drop] [--apply]');
    process.exit(1);
}
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(NEW_DB)) {
    console.error(`Неисправно име базе: ${NEW_DB} (само мала слова, цифре и подвлака)`);
    process.exit(1);
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

function urlFor(db: string) {
    const u = new URL(ADMIN_URL!);
    u.pathname = '/' + db;
    return u.toString();
}

function lit(v: unknown): string {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
    return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
    const schemaSql = fs.readFileSync(SCHEMA!, 'utf8');
    const stmtCount = (schemaSql.match(/;\s*$/gm) ?? []).length;

    console.log(`\nАдмин веза: ${new URL(ADMIN_URL!).host}${new URL(ADMIN_URL!).pathname}`);
    console.log(`Нова база:  ${NEW_DB}`);
    console.log(`Шема:       ${SCHEMA} (~${stmtCount} наредби)`);
    if (SEED.length) console.log(`Пренос:     ${SEED.join(', ')} из ${DATA}`);
    console.log(APPLY ? 'Режим:      ПРИМЕНА (--apply)\n' : 'Режим:      ПРОБА (додај --apply да стварно креира)\n');

    const admin = new Client({ connectionString: ADMIN_URL, ssl: { rejectUnauthorized: false } });
    await admin.connect();

    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [NEW_DB]);
    if (exists.rowCount) {
        if (!DROP) {
            console.error(`База "${NEW_DB}" већ постоји. Додај --drop да се обрише и направи изнова.`);
            await admin.end();
            process.exit(1);
        }
        console.log(`- бришем постојећу базу "${NEW_DB}"`);
        if (APPLY) await admin.query(`DROP DATABASE ${q(NEW_DB!)}`);
    }

    console.log(`- креирам базу "${NEW_DB}"`);
    if (APPLY) await admin.query(`CREATE DATABASE ${q(NEW_DB!)}`);
    await admin.end();

    if (!APPLY) {
        console.log('\nПроба завршена — ништа није промењено.');
        return;
    }

    const db = new Client({ connectionString: urlFor(NEW_DB!), ssl: { rejectUnauthorized: false } });
    await db.connect();
    try {
        console.log('- примењујем шему');
        await db.query(schemaSql);

        if (SEED.length) {
            if (!DATA) throw new Error('--seed захтева и --data=<data.json>');
            const all = JSON.parse(fs.readFileSync(DATA, 'utf8')) as Record<string, Record<string, unknown>[]>;
            for (const t of SEED) {
                const rows = all[t];
                if (!rows) {
                    console.log(`  ! табела "${t}" не постоји у бекапу — прескачем`);
                    continue;
                }
                for (const row of rows) {
                    const cols = Object.keys(row);
                    await db.query(
                        `INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')})`
                    );
                }
                console.log(`  + ${t}: ${rows.length} ред(ова)`);
                const seq = await db.query<{ s: string }>(
                    `SELECT pg_get_serial_sequence($1, 'id') AS s`, [`public.${t}`]
                );
                if (seq.rows[0]?.s) {
                    await db.query(`SELECT setval($1, COALESCE((SELECT MAX(id) FROM ${q(t)}), 1), true)`, [seq.rows[0].s]);
                }
            }
        }

        const check = await db.query<{ tables: string; views: string }>(
            `SELECT
               (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')::text AS tables,
               (SELECT count(*) FROM information_schema.views WHERE table_schema='public')::text AS views`
        );
        console.log(`\nГотово: ${check.rows[0].tables} табела, ${check.rows[0].views} погледа у бази "${NEW_DB}".`);
        console.log(`Веза: ${urlFor(NEW_DB!).replace(/:[^:@/]+@/, ':****@')}`);
    } finally {
        await db.end();
    }
}

main().catch((e) => {
    console.error('Неуспешно:', e.message ?? e);
    process.exit(1);
});
