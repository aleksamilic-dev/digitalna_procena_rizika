require('dotenv').config({ path: '.env' });
const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  options: { encrypt: true, trustServerCertificate: false, connectTimeout: 15000 }
};

console.log('Connecting to:', config.server, '/', config.database);

(async () => {
  try {
    let pool = await sql.connect(config);
    let res = await pool.request().query('SELECT 1 as ping, GETDATE() as now');
    console.log('✅ DB Connection OK:', res.recordset[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ DB Connection FAILED:', err.message);
    process.exit(1);
  }
})();
