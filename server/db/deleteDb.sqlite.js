// SQLite version of deleteDb. Deletes the local database file entirely
// (equivalent to a full table wipe); it is recreated on the next connection.
import fs from 'fs';
import { SQLITE_PATH } from './config.js';

export function deleteDb(dbPath = SQLITE_PATH) {
  console.log('Resetting local SQLite database...');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database deleted.');
  } else {
    console.log('No existing database found.');
  }

  console.log('Reset complete.');
}
