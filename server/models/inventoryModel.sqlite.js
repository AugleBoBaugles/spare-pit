// SQLite data access layer. Selected automatically by inventoryModel.js when DB_CLIENT=sqlite.
// See docs/DEVELOPER.md → "Choosing a Database".
import { getDb } from '../db/db.sqlite.js';

// Items store only a locationId. Each row also gets its location's name, and the id and
// name of the area that location is in (all null when the item has no location).
const SELECT_ITEMS = `
  SELECT i.*, l.name AS location, l.areaId AS areaId, a.name AS area
  FROM inventory i
  LEFT JOIN locations l ON l.id = i.locationId
  LEFT JOIN areas a ON a.id = l.areaId`;

// Returns every row in the inventory table.
export async function getAllInventory() {
  const db = await getDb();
  return db.all(`${SELECT_ITEMS} ORDER BY i.id ASC`);
}

// Case-insensitive name lookup used for duplicate detection on insert.
// Returns the first matching row, or undefined if none found.
export async function findInventoryByName(name) {
  const db = await getDb();
  return db.get('SELECT * FROM inventory WHERE LOWER(name) = LOWER(?)', name);
}

// Overwrites the given fields on a single row identified by id.
// Returns the full updated row.
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
  return db.get(`${SELECT_ITEMS} WHERE i.id = ?`, id);
}

// Returns all distinct non-empty checkOutBy values.
export async function getDistinctSubteams() {
  const db = await getDb();
  const rows = await db.all(
    `SELECT DISTINCT checkOutBy FROM inventory WHERE checkOutBy IS NOT NULL AND checkOutBy != '' ORDER BY checkOutBy`
  );
  return rows.map(r => r.checkOutBy);
}

// Inserts a new inventory item and returns the created row (including the generated id).
export async function insertInventoryItem(item) {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO inventory
        (name, type, locationId, status, quantity, condition, itemImage, checkOutBy, tags, notes, needsRestock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.name,
    item.type         ?? null,
    item.locationId   ?? null,
    item.status       ?? null,
    item.quantity     ?? null,
    item.condition    ?? null,
    item.itemImage    ?? null,
    item.checkOutBy   ?? null,
    item.tags         ?? null,
    item.notes        ?? null,
    item.needsRestock ?? 0
  );
  return db.get(`${SELECT_ITEMS} WHERE i.id = ?`, result.lastID);
}

// Fetches a single row by primary key. Returns null if the id does not exist.
export const findInventoryById = async (id) => {
  const db = await getDb();
  const result = await db.get(`${SELECT_ITEMS} WHERE i.id = ?`, [id]);
  return result ?? null;
};

// Deletes the row with the given id.
export const deleteInventoryById = async (id) => {
  const db = await getDb();
  return db.run('DELETE FROM inventory WHERE id = ?', [id]);
};

// Returns the raw tag strings from every item that has a non-empty tags column.
// Parsing (split, trim, deduplicate, sort) is left to the service layer.
export async function getAllTagStrings() {
  const db = await getDb();
  const rows = await db.all(`SELECT tags FROM inventory WHERE tags IS NOT NULL AND tags != ''`);
  return rows.map(r => r.tags);
}
