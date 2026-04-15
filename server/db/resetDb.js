import fs from 'fs';
import path from 'path';

export function resetDb(dbPath = path.resolve('./db/frc-inventory.db')) {
  console.log('Resetting database...');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database deleted.');
  } else {
    console.log('No existing database found.');
  }

  console.log('Reset complete.');
}