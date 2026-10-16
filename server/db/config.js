// Picks which database backend the server uses, based on environment variables.
//
//   DB_CLIENT=sqlite    → local SQLite file (no setup, single machine)
//   DB_CLIENT=postgres  → any PostgreSQL server (Supabase, self-hosted, Docker, ...)
//
// If DB_CLIENT is unset, Postgres is used when DATABASE_URL is set, otherwise SQLite.
// See docs/DEVELOPER.md → "Choosing a Database".
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const VALID_CLIENTS = ['sqlite', 'postgres'];

function resolveClient() {
  const explicit = process.env.DB_CLIENT?.trim().toLowerCase();
  if (explicit) {
    if (!VALID_CLIENTS.includes(explicit)) {
      throw new Error(`Invalid DB_CLIENT "${process.env.DB_CLIENT}". Use one of: ${VALID_CLIENTS.join(', ')}.`);
    }
    return explicit;
  }
  return process.env.DATABASE_URL ? 'postgres' : 'sqlite';
}

export const DB_CLIENT = resolveClient();

// Absolute path so the database file is the same no matter which directory the server is started from.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SQLITE_PATH = process.env.SQLITE_PATH
  ? path.resolve(serverRoot, process.env.SQLITE_PATH)
  : path.join(serverRoot, 'db', 'frc-inventory.db');
