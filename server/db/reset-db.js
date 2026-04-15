import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db/frc-inventory.db');

console.log('Resetting database...');

// Delete the existing database file if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Existing database deleted.');
} else {
  console.log('No existing database found.');
}