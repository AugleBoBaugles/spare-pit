import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

let supabase;

export function getDb() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.\n' +
        'Copy server/.env.example to server/.env and fill in your Supabase project credentials.\n' +
        'See the README → "Database Setup" for full instructions.\n' +
        'To run locally without Supabase, see README → "Local SQLite Development".'
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  }

  return supabase;
}
