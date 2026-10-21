import fs from 'fs';
import { getDb } from './db.js';

const SCHEMA_SQL = fs.readFileSync(new URL('./supabase-schema.sql', import.meta.url), 'utf8');

// Makes sure the Postgres tables exist and are reachable.
// Missing tables are created from supabase-schema.sql (works for Supabase and self-hosted Postgres),
// then older databases are migrated to the areas/locations model (see migrateLocations).
// Throws a descriptive error if the connection fails or the tables can't be created.
// Call this at server startup to catch misconfiguration early.
export async function initDb() {
  const db = getDb();
  let inventoryExists = true;

  try {
    await db.query('SELECT 1 FROM inventory LIMIT 1');
    console.log('Postgres inventory table verified.');
  } catch (error) {
    inventoryExists = false;
    console.log(`Inventory table not reachable (${error.message}); attempting to create it...`);
  }

  try {
    // Always run: the schema is idempotent, and it adds the areas/locations tables
    // to databases created before they existed.
    await db.query(SCHEMA_SQL);
    if (!inventoryExists) {
      await db.query('SELECT 1 FROM inventory LIMIT 1');
      console.log('Postgres inventory table created.');
    }
  } catch (error) {
    console.error('Unable to create inventory table:', error.message);
    throw new Error(
      'Postgres inventory table is unavailable. ' +
      'Check that DATABASE_URL is correct and the database user can create tables, ' +
      'or create the table manually by running server/db/supabase-schema.sql, then restart the server.'
    );
  }

  await migrateLocations(db);
  return db;
}

// Upgrades databases from before areas and locations had their own tables, when each
// item stored free-text `location` (and sometimes `area`) columns:
//   1. Every distinct area name becomes a row in `areas`.
//   2. Every distinct (area, location) pair becomes a row in `locations` — so the same
//      location name in two different areas stays two separate locations.
//   3. Each item gets the locationId of its pair, and the old text columns are dropped.
// Does nothing on an up-to-date database. Every step can safely run again and the
// column drops come last, so if a step fails the next start picks up where it left off.
async function migrateLocations(db) {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name IN ('location', 'area')`
  );
  const columns = rows.map(r => r.column_name);
  if (!columns.includes('location')) return;

  console.log('Moving item locations and areas into their own tables...');
  const hasArea = columns.includes('area');
  // The item's area name, or NULL — older databases may not have an area column at all.
  const areaOf = (table) => hasArea ? `nullif(trim(${table}.area), '')` : 'NULL';

  await db.query(
    'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "locationId" bigint REFERENCES locations(id) ON DELETE SET NULL'
  );
  if (hasArea) {
    await db.query(`
      INSERT INTO areas (name)
        SELECT DISTINCT ON (lower(trim(area))) trim(area) FROM inventory
        WHERE area IS NOT NULL AND trim(area) <> ''
      ON CONFLICT DO NOTHING
    `);
  }
  await db.query(`
    INSERT INTO locations (name, "areaId")
      SELECT DISTINCT ON (lower(trim(i.location)), a.id) trim(i.location), a.id
      FROM inventory i
      LEFT JOIN areas a ON lower(a.name) = lower(${areaOf('i')})
      WHERE i.location IS NOT NULL AND trim(i.location) <> ''
    ON CONFLICT DO NOTHING
  `);
  await db.query(`
    UPDATE inventory i SET "locationId" = (
      SELECT l.id FROM locations l
      WHERE lower(l.name) = lower(trim(i.location))
        AND coalesce(l."areaId", 0) = coalesce(
          (SELECT a.id FROM areas a WHERE lower(a.name) = lower(${areaOf('i')})), 0)
    )
    WHERE i.location IS NOT NULL AND trim(i.location) <> ''
  `);
  await db.query('ALTER TABLE inventory DROP COLUMN location');
  if (hasArea) await db.query('ALTER TABLE inventory DROP COLUMN area');
}
