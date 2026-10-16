// PostgreSQL connection — works with Supabase or any self-hosted Postgres server.
// Uses the pg driver with a single shared Pool, lazily created on first call.
// Used when DB_CLIENT=postgres; see db/config.js and docs/DEVELOPER.md → "Choosing a Database".
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
let pool;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

// Supabase and most hosted Postgres require SSL; a stock local Postgres server rejects it.
// DATABASE_SSL=true/false overrides; otherwise SSL is off for localhost and on everywhere else.
function sslOption(connectionString) {
  const setting = process.env.DATABASE_SSL?.trim().toLowerCase();
  let useSsl;
  if (setting === 'true' || setting === 'false') {
    useSsl = setting === 'true';
  } else {
    let host = '';
    try { host = new URL(connectionString).hostname; } catch { /* fall through to SSL on */ }
    useSsl = !LOCAL_HOSTS.has(host);
  }
  return useSsl ? { rejectUnauthorized: false } : false;
}

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      const err = new Error(
        'DB_CLIENT is "postgres" but DATABASE_URL is not set. ' +
        'Copy server/.env.example to server/.env and set DATABASE_URL to your Postgres connection string, ' +
        'or set DB_CLIENT=sqlite to use a local SQLite file instead. ' +
        'See docs/DEVELOPER.md → "Choosing a Database".'
      );
      err.code = 'MISSING_DB_CONFIG';
      throw err;
    }

    pool = new Pool({ connectionString, ssl: sslOption(connectionString) });
  }

  return pool;
}
