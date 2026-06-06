// SQLite data access layer — kept for local development without a Supabase project.
// To switch the app to SQLite, update the import in inventoryService.js from
// './inventoryModel.js' to './inventoryModel.sqlite.js' (and update db import below).
// See README → "Local SQLite Development" for full instructions.
import { getDb } from '../db/db.sqlite.js';

// Returns every row in the inventory table.
export async function getAllInventory() {
  const db = await getDb();
  return db.all('SELECT * FROM inventory ORDER BY id ASC');
}

// Case-insensitive name lookup used for duplicate detection on insert.
// Returns the first matching row, or undefined if none found.
export async function findInventoryByName(name) {
  const db = await getDb();
  return db.get('SELECT * FROM inventory WHERE LOWER(name) = LOWER(?)', name);
}

// Returns the list of column names for the inventory table.
// Used to validate incoming fields against the current schema.
export async function getInventoryColumns() {
  const db = await getDb();
  const rows = await db.all('PRAGMA table_info(inventory)');
  return rows.map(row => row.name);
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
  return db.get('SELECT * FROM inventory WHERE id = ?', id);
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
        (name, type, area, location, status, quantity, condition, itemImage, checkOutBy, tags, notes, needsRestock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.name,
    item.type         ?? null,
    item.area         ?? null,
    item.location     ?? null,
    item.status       ?? null,
    item.quantity     ?? null,
    item.condition    ?? null,
    item.itemImage    ?? null,
    item.checkOutBy   ?? null,
    item.tags         ?? null,
    item.notes        ?? null,
    item.needsRestock ?? 0
  );
  return db.get('SELECT * FROM inventory WHERE id = ?', result.lastID);
}

// Fetches a single row by primary key. Returns null if the id does not exist.
export const findInventoryById = async (id) => {
  const db = await getDb();
  const result = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
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
