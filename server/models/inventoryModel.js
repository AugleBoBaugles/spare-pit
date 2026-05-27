import { getDb } from '../db/db.js';

/*
 * Retrieves all inventory items from the database. Each item includes all fields defined in the inventory schema.
 * Returns an array of inventory items.
 */
export async function getAllInventory() {
    const db = await getDb();

    return db.all('SELECT * FROM inventory');
}

/*
 * Finds an inventory item by its name. Used to check for possible duplicates when adding new items.
 * Returns the inventory item if found, or undefined if no match is found.
 */
export async function findInventoryByName(name) {
    const db = await getDb();
    return db.get('SELECT * FROM inventory WHERE LOWER(name) = LOWER(?)', name);
}

/*
 * Returns the list of column names for the inventory table, derived directly from the schema.
 * Used by the service layer to validate incoming fields against the current table structure.
 */
export async function getInventoryColumns() {
    const db = await getDb();
    const rows = await db.all('PRAGMA table_info(inventory)');
    return rows.map(row => row.name);
}

/*
 * Updates an inventory item by its ID with the provided fields.
 * Returns the updated item.
 */
export async function updateInventoryItem(id, fields) {
    const db = await getDb();
    const entries = Object.entries(fields);
    const setClauses = entries.map(([col]) => `${col} = ?`).join(', ');
    const values = entries.map(([, val]) => val);
    await db.run(
        `UPDATE inventory SET ${setClauses} WHERE id = ?`,
        ...values,
        id
    );
    return db.get('SELECT * FROM inventory WHERE id = ?', id);
}

// Returns all distinct non-empty checkOutBy values in the database.
export async function getDistinctSubteams() {
    const db = await getDb();
    const rows = await db.all(
        `SELECT DISTINCT checkOutBy FROM inventory WHERE checkOutBy IS NOT NULL AND checkOutBy != '' ORDER BY checkOutBy`
    );
    return rows.map(r => r.checkOutBy);
}

/*
 * Inserts a new inventory item into the database.
 * Returns the inserted item.
 */
export async function insertInventoryItem(item) {
    const db = await getDb();
    const result = await db.run(
        `INSERT INTO inventory 
            (name, type, area, location, status, quantity, condition, itemImage, checkOutBy, tags, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.name,
        item.type ?? null,
        item.area ?? null,
        item.location ?? null,
        item.status ?? null,
        item.quantity ?? null,
        item.condition ?? null,
        item.itemImage ?? null,
        item.checkOutBy ?? null,
        item.tags ?? null,
        item.notes ?? null
    );
    return db.get('SELECT * FROM inventory WHERE id = ?', result.lastID);
}

/*
 * Finds an inventory item by its ID. Used for operations like deletion or updates.
 * Returns the inventory item if found, or null if no match is found.
 */
export const findInventoryById = async (id) => {
    const db = await getDb();

    const result = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    return result ?? null;
};

/*
 * Deletes an inventory item from the database by its ID.
 * Returns the result of the delete operation.
 */
export const deleteInventoryById = async (id) => {
    const db = await getDb();
    return db.run('DELETE FROM inventory WHERE id = ?', [id]);
};