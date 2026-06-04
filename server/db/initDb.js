import { getDb } from './db.js';

export async function initDb() {
  const db = getDb();
  const { error } = await db.from('inventory').select('id').limit(1);

  if (error) {
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
