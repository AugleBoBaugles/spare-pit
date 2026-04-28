import { getDb } from '../db/db.js';

export async function getAllInventory() {
    const db = await getDb();

    return db.all('SELECT * FROM inventory');
}