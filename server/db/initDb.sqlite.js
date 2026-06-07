// SQLite initializer — delegates to getDb(), which creates the database file
// and inventory table on first connect via CREATE TABLE IF NOT EXISTS.
// See docs/DEVELOPER.md → "Local SQLite Development".
import { getDb } from './db.sqlite.js';

export async function initDb() {
  await getDb();
  console.log('Inventory database is set up and ready to use.');
}
