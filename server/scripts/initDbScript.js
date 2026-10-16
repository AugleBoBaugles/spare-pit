import { initDb, DB_CLIENT } from '../db/index.js';

console.log(`Using database: ${DB_CLIENT}`);
await initDb();
process.exit(0);
