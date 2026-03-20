const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'pyoraily.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

async function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      year    INTEGER PRIMARY KEY,
      goal_km REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rides (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      km         REAL NOT NULL CHECK(km > 0),
      bike       TEXT NOT NULL DEFAULT 'Vanha sähkäri',
      route      TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
  `);

  await seedAdmin();
}

async function seedAdmin() {
  const row = db.prepare("SELECT value FROM config WHERE key='password_hash'").get();
  if (!row && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('username', ?)").run(process.env.ADMIN_USERNAME || 'admin');
    db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('password_hash', ?)").run(hash);
    console.log('Admin-käyttäjä luotu ympäristömuuttujista.');
  }
}

module.exports = { db, initDB };
