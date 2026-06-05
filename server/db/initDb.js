import { getDb } from './db.js';

// Verifies the Supabase inventory table is reachable.
// Throws a descriptive error if the table doesn't exist or the connection fails.
// Call this at server startup to catch misconfiguration early.
export async function initDb() {
  const db = getDb();

  try {
    await db.query('SELECT 1 FROM inventory LIMIT 1');
  } catch (error) {
    console.error('Unable to verify inventory table:', error.message);
    throw new Error(
      'Supabase inventory table is unavailable. ' +
      'Create the table by running server/db/supabase-schema.sql in the Supabase SQL editor, ' +
      'then restart the server.'
    );
  }

  console.log('Supabase inventory table verified.');
  return db;
}
