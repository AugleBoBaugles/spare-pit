import { deleteDb, DB_CLIENT } from '../db/index.js';

console.log(`Using database: ${DB_CLIENT}`);
await deleteDb();
process.exit(0);
