// Backend-agnostic entry point for database setup and reset.
// Loads the SQLite or Postgres implementation based on DB_CLIENT (see config.js).
import { DB_CLIENT } from './config.js';

const impl = DB_CLIENT === 'sqlite'
  ? { ...(await import('./initDb.sqlite.js')), ...(await import('./deleteDb.sqlite.js')) }
  : { ...(await import('./initDb.js')), ...(await import('./deleteDb.js')) };

export const { initDb, deleteDb } = impl;
export { DB_CLIENT };
