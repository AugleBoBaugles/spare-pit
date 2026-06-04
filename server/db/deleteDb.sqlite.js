// SQLite version of deleteDb — kept for local development reference.
// Deletes the local database file entirely (equivalent to a full table wipe).
// See README → "Local SQLite Development".
import fs from 'fs';
import path from 'path';

export function deleteDb(dbPath = path.resolve('./db/frc-inventory.db')) {
  console.log('Resetting local SQLite database...');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database deleted.');
  } else {
    console.log('No existing database found.');
  }

  console.log('Reset complete.');
}
