// SQLite connection — a local database file, no server or internet required.
// Self-initializing: creates the database file and inventory table on first connect.
// Used when DB_CLIENT=sqlite; see db/config.js and docs/DEVELOPER.md → "Choosing a Database".
import fs from 'fs';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { SQLITE_PATH } from './config.js';

let db;

export async function getDb() {
  if (!db) {
    const dbPath = SQLITE_PATH;
    const isNew = !fs.existsSync(dbPath);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    db = await open({ filename: dbPath, driver: sqlite3.Database });

    if (isNew) {
      console.log(`Creating new local SQLite database at ${dbPath}...`);
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
