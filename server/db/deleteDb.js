import { getDb } from './db.js';

export async function deleteDb() {
  const db = getDb();
  const { error } = await db.from('inventory').delete().neq('id', 0);

  if (error) {
    throw error;
  }

  console.log('Supabase inventory table cleared.');
}
