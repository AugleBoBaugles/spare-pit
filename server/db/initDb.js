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
      location TEXT,
      status TEXT
    )
  `);

  console.log('Inventory database is set up and ready to use.');

  return db;
}