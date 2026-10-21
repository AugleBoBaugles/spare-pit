import { getDb } from './db.js';

// Deletes all rows from the Postgres inventory, locations and areas tables (the schema itself is preserved).
// Intended for testing and development resets — use with caution in production.
export async function deleteDb() {
  const db = getDb();
  await db.query('DELETE FROM inventory');
  await db.query('DELETE FROM locations');
  await db.query('DELETE FROM areas');
  console.log('Postgres inventory, locations and areas tables cleared.');
}
