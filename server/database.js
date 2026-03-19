const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      year    INTEGER PRIMARY KEY,
      goal_km DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rides (
      id         SERIAL PRIMARY KEY,
      date       TEXT NOT NULL,
      km         DOUBLE PRECISION NOT NULL CHECK(km > 0),
      bike       TEXT NOT NULL DEFAULT 'Vanha sähkäri',
      route      TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
  `);

  await seedAdmin();
}

async function seedAdmin() {
  const { rows } = await pool.query("SELECT value FROM config WHERE key='password_hash'");
  if (rows.length === 0 && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await pool.query(
      "INSERT INTO config (key, value) VALUES ('username', $1) ON CONFLICT DO NOTHING",
      [process.env.ADMIN_USERNAME || 'admin']
    );
    await pool.query(
      "INSERT INTO config (key, value) VALUES ('password_hash', $1) ON CONFLICT DO NOTHING",
      [hash]
    );
    console.log('Admin-käyttäjä luotu ympäristömuuttujista.');
  }
}

module.exports = { pool, initDB };
