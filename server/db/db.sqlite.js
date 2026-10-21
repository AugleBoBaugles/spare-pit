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

    // Names compare ignoring case (COLLATE NOCASE). Area names are unique; location
    // names only have to be unique within their area, so two areas can each have a
    // "Tool Cabinet A". Unassigned locations (areaId NULL) count as one group.
    // Items point at one exact location by id; NULL means no location.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE
      );

      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE,
        areaId INTEGER REFERENCES areas(id) ON DELETE SET NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS locations_area_name
        ON locations (IFNULL(areaId, 0), name);

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        locationId INTEGER REFERENCES locations(id) ON DELETE SET NULL,
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

    await migrateLocations(db);

    console.log('Local SQLite database ready.');
  }
  return db;
}

// Upgrades databases from before areas and locations had their own tables, when each
// item stored free-text `location` (and sometimes `area`) columns:
//   1. Every distinct area name becomes a row in `areas`.
//   2. Every distinct (area, location) pair becomes a row in `locations` — so the same
//      location name in two different areas stays two separate locations.
//   3. Each item gets the locationId of its pair, and the old text columns are dropped.
// Does nothing on an up-to-date database. Runs in one transaction, so a failure leaves
// the old data untouched.
async function migrateLocations(db) {
  const columns = (await db.all('PRAGMA table_info(inventory)')).map(c => c.name);
  if (!columns.includes('location')) return;

  console.log('Moving item locations and areas into their own tables...');
  const hasArea = columns.includes('area');
  // The item's area name, or NULL — older databases may not have an area column at all.
  const areaOf = (table) => hasArea ? `NULLIF(TRIM(${table}.area), '')` : 'NULL';

  await db.exec('BEGIN');
  try {
    await db.exec('ALTER TABLE inventory ADD COLUMN locationId INTEGER REFERENCES locations(id) ON DELETE SET NULL');
    if (hasArea) {
      await db.exec(`
        INSERT OR IGNORE INTO areas (name)
          SELECT DISTINCT TRIM(area) FROM inventory
          WHERE area IS NOT NULL AND TRIM(area) != ''
      `);
    }
    // INSERT OR IGNORE skips pairs that differ only in case (the unique index ignores case).
    await db.exec(`
      INSERT OR IGNORE INTO locations (name, areaId)
        SELECT DISTINCT TRIM(i.location), a.id
        FROM inventory i
        LEFT JOIN areas a ON a.name = ${areaOf('i')}
        WHERE i.location IS NOT NULL AND TRIM(i.location) != ''
    `);
    await db.exec(`
      UPDATE inventory SET locationId = (
        SELECT l.id FROM locations l
        WHERE l.name = TRIM(inventory.location)
          AND IFNULL(l.areaId, 0) = IFNULL((SELECT a.id FROM areas a WHERE a.name = ${areaOf('inventory')}), 0)
      )
      WHERE location IS NOT NULL AND TRIM(location) != ''
    `);
    await db.exec('ALTER TABLE inventory DROP COLUMN location');
    if (hasArea) await db.exec('ALTER TABLE inventory DROP COLUMN area');
    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}
