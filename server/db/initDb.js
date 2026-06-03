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

  // Migration: add needsRestock to databases created before this column existed.
  // ALTER TABLE fails if the column already exists, so we swallow that error.
  try {
    await db.run('ALTER TABLE inventory ADD COLUMN needsRestock INTEGER DEFAULT 0');
  } catch {
    // Column already present — nothing to do.
  }

  console.log('Inventory database is set up and ready to use.');

  return db;
}