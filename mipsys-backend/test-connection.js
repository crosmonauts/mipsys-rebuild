const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'intern',
  password: process.env.DB_PASS || 'intern123',
  database: process.env.DB_NAME || 'db_mipsys',
  port: Number(process.env.DB_PORT) || 5433,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.stack);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});