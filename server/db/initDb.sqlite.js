// SQLite version of initDb — kept for local development reference.
// db.sqlite.js already creates the table on first connect, so this script
// is only needed if you want an explicit "verify the schema exists" step.
// See README → "Local SQLite Development".
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDb(dbPath = 'db/frc-inventory.db') {
  const dbExists = fs.existsSync(dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  if (!dbExists) {
    console.log('New database created.');
  } else {
    console.log('Database already exists.');
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      area TEXT,
      location TEXT,
      status TEXT,
      quantity INTEGER,
      condition TEXT,
      itemImage TEXT,
      checkOutBy TEXT,
      lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      tags TEXT,
      notes TEXT,
      needsRestock INTEGER DEFAULT 0
    )
  `);

  console.log('Inventory database is set up and ready to use.');

  return db;
}
