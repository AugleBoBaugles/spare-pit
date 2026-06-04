import { getDb } from './db.js';

// Deletes all rows from the Supabase inventory table (the schema itself is preserved).
// Intended for testing and development resets — use with caution in production.
export async function deleteDb() {
  const db = getDb();
  await db.query('DELETE FROM inventory');
  console.log('Supabase inventory table cleared.');
}
