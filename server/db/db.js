// Primary database connection — PostgreSQL via the Supabase Transaction Pooler.
// Uses the pg driver with a single shared Pool, lazily created on first call.
// To run locally without Supabase, see db.sqlite.js and README → "Local SQLite Development".
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
let pool;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'Missing required environment variable: DATABASE_URL must be set.\n' +
        'Copy server/.env.example to server/.env and fill in your Supabase Transaction Pooler connection string.\n' +
        'Find it at: Supabase dashboard → Settings → Database → Connection string → Transaction pooler.\n' +
        'To run locally without Supabase, see README → "Local SQLite Development".'
      );
    }

    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }

  return pool;
}
