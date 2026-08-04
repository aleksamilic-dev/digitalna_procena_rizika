-- PostgreSQL schema for Digitalna Procena Rizika (Neon)
-- Generated for migration from Azure SQL (MSSQL)

CREATE TABLE IF NOT EXISTS korisnici (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    lozinka VARCHAR(255) NOT NULL,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'na_cekanju' NOT NULL,
    je_admin BOOLEAN DEFAULT FALSE,
    datum_kreiranja TIMESTAMP DEFAULT NOW(),
    datum_odobrenja TIMESTAMP NULL,
    odobrio_admin INT NULL
);

CREATE TABLE IF NOT EXISTS "PravnoLice" (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(255) NOT NULL,
    skraceno_poslovno_ime VARCHAR(255),
    pib VARCHAR(20) NOT NULL UNIQUE,
    maticni_broj VARCHAR(20),
    adresa VARCHAR(500),
    adresa_sediste VARCHAR(500),
    adresa_ostala TEXT,
    sifra_delatnosti VARCHAR(255),
    lice_zastupanje TEXT,
    lice_komunikacija TEXT,
    tim_procena_rizika TEXT,
    telefon VARCHAR(50),
    telefon_faks VARCHAR(100),
    email VARCHAR(255),
    internet_adresa VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProcenaRizika" (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(255) NOT NULL,
    opis TEXT,
    "korisnikId" INT REFERENCES korisnici(id) ON DELETE SET NULL,
    "pravnoLiceId" INT REFERENCES "PravnoLice"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'u_toku',
    naziv_usluge VARCHAR(500),
    datum_izrade DATE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrganizacijaProceneRizika" (
    id SERIAL PRIMARY KEY,
    "pravnoLiceId" INT NOT NULL REFERENCES "PravnoLice"(id) ON DELETE CASCADE,
    poslovno_ime VARCHAR(255),
    adresa_sediste VARCHAR(500),
    maticni_broj VARCHAR(20),
    pib VARCHAR(20),
    broj_licence VARCHAR(100),
    menadzer_ime VARCHAR(255),
    menadzer_licence VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ClanoviTimaProceneRizika" (
    id SERIAL PRIMARY KEY,
    "organizacijaId" INT NOT NULL REFERENCES "OrganizacijaProceneRizika"(id) ON DELETE CASCADE,
    ime VARCHAR(255) NOT NULL,
    broj_licence VARCHAR(100) NOT NULL,
    redni_broj INT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "RiskSelection" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "riskId" VARCHAR(50) NOT NULL,
    "dangerLevel" INT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "riskId")
);

CREATE TABLE IF NOT EXISTS "FinancialData" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "poslovniPrihodi" DECIMAL(15,2),
    "vrednostImovine" DECIMAL(15,2),
    delatnost VARCHAR(500),
    "stvarnaSteta" DECIMAL(15,2),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PrilogM" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    verovatnoca INT,
    steta INT,
    kriticnost INT,
    posledice VARCHAR(255),
    "nivoRizika" VARCHAR(100),
    "kategorijaRizika" VARCHAR(100),
    prihvatljivost VARCHAR(50),
    "stepenSS" DECIMAL(10,2),
    "stepenVMSH" DECIMAL(10,2),
    "vmshIznos" DECIMAL(15,2),
    "opisIdentifikovanihRizika" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

ALTER TABLE "PrilogM"
    ADD COLUMN IF NOT EXISTS requirement TEXT,
    ADD COLUMN IF NOT EXISTS "velicinaOpasnosti" INT,
    ADD COLUMN IF NOT EXISTS izlozenost INT,
    ADD COLUMN IF NOT EXISTS ranjivost INT;

CREATE TABLE IF NOT EXISTS "PrilogMSection" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "sectionId" VARCHAR(50) NOT NULL,
    "dominantnaKategorija" VARCHAR(100),
    "prihvatljivostStatus" VARCHAR(50),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "sectionId")
);

CREATE TABLE IF NOT EXISTS "PrilogB1" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    svo DECIMAL(10,2),
    uticaj DECIMAL(10,2),
    iud DECIMAL(10,2),
    kvo DECIMAL(10,2),
    ivo DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogCh" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    p1 DECIMAL(10,2),
    p2 DECIMAL(10,2),
    p3 DECIMAL(10,2),
    p4 DECIMAL(10,2),
    p5 DECIMAL(10,2),
    p6 DECIMAL(10,2),
    final_score DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogFGeneral" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    a1 DECIMAL(10,2),
    a2 DECIMAL(10,2),
    a3 DECIMAL(10,2),
    a4 DECIMAL(10,2),
    a5 DECIMAL(10,2),
    a6 DECIMAL(10,2),
    a7 DECIMAL(10,2),
    a8 DECIMAL(10,2),
    a9 DECIMAL(10,2),
    a10 DECIMAL(10,2),
    a11 DECIMAL(10,2),
    a12 DECIMAL(10,2),
    final_total DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogF5" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    mera TEXT,
    opis_i_obrazlozenje TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "TabelaF5" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    mera TEXT,
    opis_i_obrazlozenje TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogLj" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    vrednost1 DECIMAL(10,2),
    vrednost2 DECIMAL(10,2),
    vrednost3 DECIMAL(10,2),
    vrednost4 DECIMAL(10,2),
    vrednost5 DECIMAL(10,2),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogS" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    vrednost DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogT" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    v1 DECIMAL(10,2),
    v2 DECIMAL(10,2),
    v3 DECIMAL(10,2),
    v4 DECIMAL(10,2),
    v5 DECIMAL(10,2),
    v6 DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "PrilogU" (
    id SERIAL PRIMARY KEY,
    "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "itemId" VARCHAR(50) NOT NULL,
    "groupId" VARCHAR(50),
    naziv VARCHAR(500),
    v1 DECIMAL(10,2),
    v2 DECIMAL(10,2),
    v3 DECIMAL(10,2),
    v4 DECIMAL(10,2),
    v5 DECIMAL(10,2),
    v6 DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE("procenaId", "itemId")
);

CREATE TABLE IF NOT EXISTS "Usluge" (
    id SERIAL PRIMARY KEY,
    "pravnoLiceId" INT NOT NULL REFERENCES "PravnoLice"(id) ON DELETE CASCADE,
    naziv_usluge VARCHAR(500),
    datum_izrade DATE,
    opis TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GrupaRizika" (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(255) NOT NULL,
    redosled INT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pravnolice_pib ON "PravnoLice"(pib);
CREATE INDEX IF NOT EXISTS idx_procenarizika_pravnoliceid ON "ProcenaRizika"("pravnoLiceId");
CREATE INDEX IF NOT EXISTS idx_riskselection_procenaid ON "RiskSelection"("procenaId");
CREATE INDEX IF NOT EXISTS idx_prilogm_procenaid ON "PrilogM"("procenaId");
CREATE INDEX IF NOT EXISTS idx_organizacija_pravnoliceid ON "OrganizacijaProceneRizika"("pravnoLiceId");
CREATE INDEX IF NOT EXISTS idx_clanovi_organizacijaid ON "ClanoviTimaProceneRizika"("organizacijaId");

-- Compatibility views for the legacy API. PostgreSQL folds unquoted
-- identifiers to lowercase, while the migrated tables retain CamelCase names.
-- The views expose both the original and lowercase forms of CamelCase columns
-- and remain automatically updatable because each column maps directly to one
-- base-table column.
DO $$
DECLARE
    table_record RECORD;
    column_list TEXT;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name <> lower(table_name)
          AND table_name NOT IN ('PrilogB1', 'PrilogCh', 'PrilogS', 'PrilogT', 'PrilogU', 'TabelaF5')
    LOOP
        SELECT string_agg(
            CASE
                WHEN column_name = lower(column_name) THEN format('%I', column_name)
                ELSE format('%I, %I AS %I', column_name, column_name, lower(column_name))
            END,
            ', ' ORDER BY ordinal_position
        )
        INTO column_list
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = table_record.table_name;

        EXECUTE format(
            'CREATE OR REPLACE VIEW %I AS SELECT %s FROM %I',
            lower(table_record.table_name),
            column_list,
            table_record.table_name
        );
    END LOOP;
END $$;

-- Legacy attachment storage used by the existing API routes. These tables use
-- the route's snake_case contract and are kept separate from the newer tables
-- above so no data is lost during the MSSQL-to-PostgreSQL transition.
DO $$
DECLARE relation_name TEXT;
BEGIN
    FOREACH relation_name IN ARRAY ARRAY['prilog_b1', 'prilog_ch', 'prilog_f_data', 'prilog_s', 'prilog_t', 'prilog_u', 'tabela_f5']
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class WHERE relname = relation_name AND relkind = 'v'
        ) THEN
            EXECUTE format('DROP VIEW %I', relation_name);
        END IF;
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS prilog_b1 (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    group_id INT NOT NULL, svo DECIMAL(10,2), uticaj DECIMAL(10,2), iud DECIMAL(10,4), kvo DECIMAL(10,4), ivo DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id, group_id)
);
CREATE TABLE IF NOT EXISTS prilog_ch (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    zahtev_a DECIMAL(10,2), zahtev_b DECIMAL(10,2), zahtev_v DECIMAL(10,2), zahtev_g DECIMAL(10,2), zahtev_d DECIMAL(10,2), zahtev_dj DECIMAL(10,2),
    final_score DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id)
);
CREATE TABLE IF NOT EXISTS prilog_t (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    kapital_score DECIMAL(10,2), menadzeri_score DECIMAL(10,2), osiguranje_score DECIMAL(10,2), registar_score DECIMAL(10,2), zarada_score DECIMAL(10,2), prosek_resursa DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id)
);
CREATE TABLE IF NOT EXISTS prilog_u (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    zahtev_a DECIMAL(10,2), zahtev_b DECIMAL(10,2), zahtev_v DECIMAL(10,2), zahtev_g DECIMAL(10,2), zahtev_d DECIMAL(10,2), final_score DECIMAL(10,2), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id)
);
CREATE TABLE IF NOT EXISTS prilog_s (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    group_id VARCHAR(50), item_id VARCHAR(50) NOT NULL, vrednost DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id, group_id, item_id)
);
CREATE TABLE IF NOT EXISTS tabela_f5 (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    group_id VARCHAR(50), item_id VARCHAR(50), mera TEXT, opis_i_obrazlozenje TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS prilog_f_data (
    id SERIAL PRIMARY KEY, procena_id INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    f1_podaci_o_organizaciji TEXT, f1_menadzer_rizika TEXT, f2_podaci_o_posmatranoj_org TEXT, f2_sifra_delatnosti TEXT, f2_odgovorno_lice TEXT, f2_podaci_o_licima TEXT,
    f3_eksterni_kontekst TEXT, f3_interni_kontekst TEXT, f4_identifikacija TEXT, f4_analiza TEXT, f4_vrednovanje TEXT, f6_zakljucak TEXT, updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(procena_id)
);

CREATE TABLE IF NOT EXISTS "PrilogMSections" (
    id SERIAL PRIMARY KEY, "procenaId" INT NOT NULL REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "sectionNumber" INT NOT NULL, "sectionTitle" TEXT, "totalItems" INT DEFAULT 0, "completedItems" INT DEFAULT 0,
    "averageVO" DECIMAL(10,2), "averageIzlozenost" DECIMAL(10,2), "averageRanjivost" DECIMAL(10,2), "averageVerovatnoca" DECIMAL(10,2), "averagePosledice" DECIMAL(10,2), "averageSteta" DECIMAL(10,2), "averageKriticnost" DECIMAL(10,2), "averageNivoRizika" DECIMAL(10,2), "dominantnaKategorija" TEXT, "prihvatljivostStatus" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("procenaId", "sectionNumber")
);
CREATE TABLE IF NOT EXISTS "PrilogMSummary" (
    id SERIAL PRIMARY KEY, "procenaId" INT NOT NULL UNIQUE REFERENCES "ProcenaRizika"(id) ON DELETE CASCADE,
    "ukupnoStavki" INT DEFAULT 0, "ukupnoZavrsenih" INT DEFAULT 0, "ukupanNivoRizika" DECIMAL(10,2), "ukupnaKategorija" TEXT, "ukupnaPrihvatljivost" TEXT, "procenatZavrsenosti" DECIMAL(10,2), preporuke TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Older attachment routes use snake_case table and column names. Provide
-- updatable aliases while those routes are progressively migrated.
DO $$
DECLARE
    table_record RECORD;
    snake_table_name TEXT;
    column_list TEXT;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name <> lower(table_name)
          AND table_name NOT IN ('PrilogB1', 'PrilogCh', 'PrilogS', 'PrilogT', 'PrilogU', 'TabelaF5')
    LOOP
        snake_table_name := lower(regexp_replace(table_record.table_name, '([a-z0-9])([A-Z])', '\1_\2', 'g'));
        IF snake_table_name <> lower(table_record.table_name) THEN
            SELECT string_agg(
                CASE
                    WHEN column_name = lower(regexp_replace(column_name, '([a-z0-9])([A-Z])', '\1_\2', 'g')) THEN format('%I', column_name)
                    ELSE format('%I, %I AS %I', column_name, column_name, lower(regexp_replace(column_name, '([a-z0-9])([A-Z])', '\1_\2', 'g')))
                END,
                ', ' ORDER BY ordinal_position
            )
            INTO column_list
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = table_record.table_name;

            EXECUTE format(
                'CREATE OR REPLACE VIEW %I AS SELECT %s FROM %I',
                snake_table_name,
                column_list,
                table_record.table_name
            );
        END IF;
    END LOOP;
END $$;
