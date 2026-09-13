/**
 * Бекап Postgres базе без pg_dump-а.
 *
 * Прави фолдер backups/<timestamp>/ са:
 *   schema.sql  – DDL прочитан из живе базе (секвенце, табеле, ограничења, индекси, погледи)
 *   data.sql    – INSERT наредбе у редоследу који поштује стране кључеве + setval за секвенце
 *   data.json   – исти подаци у JSON облику (лакше за програмску обраду)
 *   manifest.json – списак табела и број редова
 *
 * Покретање:
 *   npx tsx scripts/db-backup.ts                 # бекап базе из DATABASE_URL
 *   npx tsx scripts/db-backup.ts --url=postgres://...
 *   npx tsx scripts/db-backup.ts --out=putanja
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env.production', quiet: true });
dotenv.config({ quiet: true });

import * as fs from 'fs';
import * as path from 'path';
import { Pool, PoolClient } from 'pg';

const arg = (name: string) => {
    const a = process.argv.find((x) => x.startsWith(`--${name}=`));
    return a ? a.slice(name.length + 3) : undefined;
};

const DATABASE_URL = arg('url') ?? process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('Недостаје DATABASE_URL (у .env.local / .env или преко --url=...).');
    process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = arg('out') ?? path.join('backups', stamp);

/** Postgres literal за произвољну JS вредност. */
function lit(v: unknown): string {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (v instanceof Date) return `'${v.toISOString()}'`;
    if (Buffer.isBuffer(v)) return `'\\x${v.toString('hex')}'`;
    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
    return `'${String(v).replace(/'/g, "''")}'`;
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

type FK = { table: string; refTable: string };

/** Табеле поређане тако да родитељи долазе пре деце (за редослед INSERT-а). */
function topoSort(tables: string[], fks: FK[]): string[] {
    const deps = new Map<string, Set<string>>(tables.map((t) => [t, new Set<string>()]));
    for (const { table, refTable } of fks) {
        if (table !== refTable && deps.has(table) && deps.has(refTable)) {
            deps.get(table)!.add(refTable);
        }
    }
    const out: string[] = [];
    const done = new Set<string>();
    let guard = tables.length + 1;
    while (out.length < tables.length && guard-- > 0) {
        for (const t of tables) {
            if (done.has(t)) continue;
            if ([...deps.get(t)!].every((d) => done.has(d))) {
                out.push(t);
                done.add(t);
            }
        }
    }
    for (const t of tables) if (!done.has(t)) out.push(t); // циклус – врати како јесте
    return out;
}

async function main() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2,
        connectionTimeoutMillis: 30000,
    });
    const c: PoolClient = await pool.connect();

    try {
        fs.mkdirSync(OUT, { recursive: true });
        const host = new URL(DATABASE_URL!).host;
        const dbName = (await c.query<{ d: string }>('SELECT current_database() AS d')).rows[0].d;
        console.log(`\nБаза: ${dbName} @ ${host}`);
        console.log(`Излаз: ${OUT}\n`);

        const tables = (
            await c.query<{ table_name: string }>(
                `SELECT table_name FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                  ORDER BY table_name`
            )
        ).rows.map((r) => r.table_name);

        // ---------- schema.sql ----------
        const ddl: string[] = [
            `-- DDL прочитан из живе базе ${dbName} @ ${host}`,
            `-- ${new Date().toISOString()}`,
            '',
        ];

        const seqs = (
            await c.query<{ sequencename: string; start_value: string; increment_by: string }>(
                `SELECT sequencename, start_value::text, increment_by::text
                   FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename`
            )
        ).rows;
        if (seqs.length) {
            ddl.push('-- секвенце');
            for (const s of seqs) {
                ddl.push(
                    `CREATE SEQUENCE IF NOT EXISTS ${q(s.sequencename)} START WITH ${s.start_value} INCREMENT BY ${s.increment_by};`
                );
            }
            ddl.push('');
        }

        ddl.push('-- табеле');
        for (const t of tables) {
            const cols = (
                await c.query<{ name: string; type: string; notnull: boolean; def: string | null }>(
                    `SELECT a.attname                                   AS name,
                            format_type(a.atttypid, a.atttypmod)        AS type,
                            a.attnotnull                                AS notnull,
                            pg_get_expr(d.adbin, d.adrelid)             AS def
                       FROM pg_attribute a
                       LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                      WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped
                      ORDER BY a.attnum`,
                    [`public.${q(t)}`]
                )
            ).rows;
            const body = cols.map(
                (col) =>
                    `    ${q(col.name)} ${col.type}` +
                    (col.def ? ` DEFAULT ${col.def}` : '') +
                    (col.notnull ? ' NOT NULL' : '')
            );
            ddl.push(`CREATE TABLE IF NOT EXISTS ${q(t)} (\n${body.join(',\n')}\n);`);
        }
        ddl.push('');

        // Прво primary key / unique / check за СВЕ табеле, тек онда стране кључеве —
        // иначе FK може да упути на табелу чији UNIQUE још није направљен.
        const fks: FK[] = [];
        const localDdl: string[] = [];
        const fkDdl: string[] = [];
        for (const t of tables) {
            const cons = (
                await c.query<{ conname: string; def: string; contype: string; reftable: string | null }>(
                    `SELECT c.conname, pg_get_constraintdef(c.oid) AS def, c.contype::text,
                            CASE WHEN c.confrelid <> 0 THEN c.confrelid::regclass::text END AS reftable
                       FROM pg_constraint c
                      WHERE c.conrelid = $1::regclass
                      ORDER BY CASE c.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END,
                               c.conname`,
                    [`public.${q(t)}`]
                )
            ).rows;
            for (const k of cons) {
                const line = `ALTER TABLE ${q(t)} ADD CONSTRAINT ${q(k.conname)} ${k.def};`;
                if (k.contype === 'f') {
                    fkDdl.push(line);
                    if (k.reftable) {
                        fks.push({ table: t, refTable: k.reftable.replace(/^public\./, '').replace(/"/g, '') });
                    }
                } else {
                    localDdl.push(line);
                }
            }
        }
        ddl.push('-- ограничења: primary key, unique, check');
        ddl.push(...localDdl, '');
        ddl.push('-- ограничења: strani kljucevi (после свих unique/primary key)');
        ddl.push(...fkDdl, '');

        const idx = (
            await c.query<{ indexdef: string }>(
                `SELECT i.indexdef
                   FROM pg_indexes i
                  WHERE i.schemaname = 'public'
                    AND NOT EXISTS (
                        SELECT 1 FROM pg_constraint c
                         WHERE c.conname = i.indexname AND c.connamespace = 'public'::regnamespace)
                  ORDER BY i.tablename, i.indexname`
            )
        ).rows;
        if (idx.length) {
            ddl.push('-- индекси');
            for (const i of idx) ddl.push(i.indexdef + ';');
            ddl.push('');
        }

        const views = (
            await c.query<{ viewname: string; definition: string }>(
                `SELECT viewname, pg_get_viewdef(('public.' || quote_ident(viewname))::regclass, true) AS definition
                   FROM pg_views WHERE schemaname = 'public' ORDER BY viewname`
            )
        ).rows;
        if (views.length) {
            ddl.push('-- погледи (компатибилни називи колона)');
            for (const v of views) {
                ddl.push(`CREATE OR REPLACE VIEW ${q(v.viewname)} AS\n${v.definition.trim()}`);
            }
            ddl.push('');
        }

        fs.writeFileSync(path.join(OUT, 'schema.sql'), ddl.join('\n'), 'utf8');

        // ---------- data ----------
        const order = topoSort(tables, fks);
        const json: Record<string, unknown[]> = {};
        const manifest: Array<{ table: string; rows: number }> = [];
        const data: string[] = [
            `-- Подаци из ${dbName} @ ${host}`,
            `-- ${new Date().toISOString()}`,
            'BEGIN;',
            '',
        ];

        let total = 0;
        for (const t of order) {
            const res = await c.query(`SELECT * FROM ${q(t)}`);
            json[t] = res.rows;
            manifest.push({ table: t, rows: res.rows.length });
            total += res.rows.length;
            if (!res.rows.length) continue;
            const cols = res.fields.map((f) => f.name);
            data.push(`-- ${t} (${res.rows.length})`);
            for (const row of res.rows) {
                const vals = cols.map((cn) => lit((row as Record<string, unknown>)[cn]));
                data.push(
                    `INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${vals.join(', ')});`
                );
            }
            data.push('');
        }

        if (seqs.length) {
            data.push('-- усклађивање секвенци');
            for (const s of seqs) {
                const v = await c.query<{ last_value: string }>(
                    `SELECT last_value::text FROM ${q(s.sequencename)}`
                );
                data.push(`SELECT setval('${s.sequencename}', ${v.rows[0].last_value}, true);`);
            }
            data.push('');
        }
        data.push('COMMIT;');

        fs.writeFileSync(path.join(OUT, 'data.sql'), data.join('\n'), 'utf8');
        fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(json, null, 2), 'utf8');
        fs.writeFileSync(
            path.join(OUT, 'manifest.json'),
            JSON.stringify(
                { database: dbName, host, createdAt: new Date().toISOString(), totalRows: total, tables: manifest },
                null,
                2
            ),
            'utf8'
        );

        console.log(`Табела: ${tables.length}, погледа: ${views.length}, секвенци: ${seqs.length}`);
        console.log(`Укупно редова: ${total}`);
        console.log('\nНепразне табеле:');
        for (const m of manifest.filter((x) => x.rows > 0)) {
            console.log(`  ${m.table.padEnd(32)}${m.rows}`);
        }
        console.log(`\nБекап уписан у ${OUT}`);
    } finally {
        c.release();
        await pool.end();
    }
}

main().catch((e) => {
    console.error('Бекап неуспешан:', e);
    process.exit(1);
});
