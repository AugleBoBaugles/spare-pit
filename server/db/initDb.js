import fs from 'fs';
import { getDb } from './db.js';

const SCHEMA_SQL = fs.readFileSync(new URL('./supabase-schema.sql', import.meta.url), 'utf8');

// Makes sure the Postgres inventory table exists and is reachable.
// If the table is missing, creates it from supabase-schema.sql (works for Supabase and self-hosted Postgres).
// Throws a descriptive error if the connection fails or the table can't be created.
// Call this at server startup to catch misconfiguration early.
export async function initDb() {
  const db = getDb();

  try {
    await db.query('SELECT 1 FROM inventory LIMIT 1');
    console.log('Postgres inventory table verified.');
    return db;
  } catch (error) {
    console.log(`Inventory table not reachable (${error.message}); attempting to create it...`);
  }

  try {
    await db.query(SCHEMA_SQL);
    await db.query('SELECT 1 FROM inventory LIMIT 1');
  } catch (error) {
    console.error('Unable to create inventory table:', error.message);
    throw new Error(
      'Postgres inventory table is unavailable. ' +
      'Check that DATABASE_URL is correct and the database user can create tables, ' +
      'or create the table manually by running server/db/supabase-schema.sql, then restart the server.'
    );
  }

  console.log('Postgres inventory table created.');
  return db;
}
