// SQLite connection — used for local development without a Supabase project.
// Self-initializing: creates the database file and inventory table on first connect.
// See README → "Local SQLite Development" for how to switch the app to this backend.
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db;

export async function getDb() {
  if (!db) {
    const dbPath = 'db/frc-inventory.db';
    const isNew = !fs.existsSync(dbPath);

    db = await open({ filename: dbPath, driver: sqlite3.Database });

    if (isNew) {
      console.log('Creating new local SQLite database...');
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

    console.log('Local SQLite database ready.');
  }
  return db;
}
