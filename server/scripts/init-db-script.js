import { initDb } from '../db/initDb.js';

const db = await initDb();
await db.close();