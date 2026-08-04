require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('Connecting to Neon...');
    await pool.query('SELECT 1');
    console.log('✅ Connected!');

    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    console.log('Running schema...');
    await pool.query(schema);
    console.log('✅ Schema created!');

    // Create admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO korisnici (email, lozinka, ime, prezime, status, je_admin)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@admin.com', adminPassword, 'Admin', 'Administrator', 'odobren', true]);
    console.log('✅ Admin user ready!');

    const tables = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
    console.log('\n📋 Tables created:');
    tables.rows.forEach(r => console.log(' -', r.tablename));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
