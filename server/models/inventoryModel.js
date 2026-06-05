// PostgreSQL data access layer (Supabase via pg driver). All direct database queries live here.
// Columns itemImage, checkOutBy, and lastUpdated are camelCase and must be double-quoted
// in SQL because PostgreSQL folds unquoted identifiers to lowercase.
//
// To switch the app to local SQLite instead:
//   1. In server/services/inventoryService.js, change the model import to inventoryModel.sqlite.js
//   2. See README → "Local SQLite Development" for full instructions
import { getDb } from '../db/db.js';

// Columns whose names must be double-quoted in SQL to preserve camelCase casing.
const QUOTED_COLS = new Set(['itemImage', 'checkOutBy', 'lastUpdated', 'needsRestock']);

function col(name) {
  return QUOTED_COLS.has(name) ? `"${name}"` : name;
}

// Converts a lastUpdated value to an ISO 8601 string for PostgreSQL's timestamptz column.
// Accepts a Unix ms timestamp (Date.now()), an existing ISO string, or null/undefined.
function normalizeTimestamp(value) {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : new Date(value).toISOString();
}

// Returns every row in the inventory table, sorted by id ascending.
export async function getAllInventory() {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM inventory ORDER BY id ASC');
  return rows;
}

// Case-insensitive name lookup used for duplicate detection on insert.
// Returns the first matching row, or null if none found.
export async function findInventoryByName(name) {
  const db = getDb();
  const { rows } = await db.query(
    'SELECT * FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [name]
  );
  return rows[0] ?? null;
}

// Fetches a single row by primary key. Returns null if the id does not exist.
export const findInventoryById = async (id) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
  return rows[0] ?? null;
};

// Inserts a new inventory item and returns the created row (including the generated id).
export async function insertInventoryItem(item) {
  const db = getDb();
  const { rows } = await db.query(
    `INSERT INTO inventory
       (name, type, area, location, status, quantity, condition, "itemImage", "checkOutBy", "lastUpdated", tags, notes, "needsRestock")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      item.name,
      item.type         ?? null,
      item.area         ?? null,
      item.location     ?? null,
      item.status       ?? null,
      item.quantity     ?? null,
      item.condition    ?? null,
      item.itemImage    ?? null,
      item.checkOutBy   ?? null,
      normalizeTimestamp(item.lastUpdated),
      item.tags         ?? null,
      item.notes        ?? null,
      item.needsRestock ?? 0,
    ]
  );
  return rows[0];
}

// Overwrites the given fields on the row identified by id.
// Returns the full updated row as stored in the database.
export async function updateInventoryItem(id, fields) {
  const db = getDb();
  const normalized = { ...fields, lastUpdated: normalizeTimestamp(fields.lastUpdated) };
  const entries = Object.entries(normalized);

  // Build a parameterized SET clause, quoting camelCase column names.
  const setClauses = entries.map(([name], i) => `${col(name)} = $${i + 1}`).join(', ');
  const values = [...entries.map(([, v]) => v), id];

  const { rows } = await db.query(
    `UPDATE inventory SET ${setClauses} WHERE id = $${entries.length + 1} RETURNING *`,
    values
  );
  return rows[0];
}

// Returns an array of unique, non-empty checkOutBy values across all rows.
// Used to populate the subteams dropdown in the UI.
export async function getDistinctSubteams() {
  const db = getDb();
  const { rows } = await db.query(
    `SELECT DISTINCT "checkOutBy" FROM inventory
     WHERE "checkOutBy" IS NOT NULL AND "checkOutBy" != ''
     ORDER BY "checkOutBy" ASC`
  );
  return rows.map(r => r.checkOutBy);
}

// Deletes the row with the given id. Returns true on success.
export const deleteInventoryById = async (id) => {
  const db = getDb();
  await db.query('DELETE FROM inventory WHERE id = $1', [id]);
  return true;
};

// Returns the raw tags strings from every item that has a non-empty tags column.
// Parsing (split, trim, deduplicate, sort) is left to the service layer.
export async function getAllTagStrings() {
  const db = getDb();
  const { rows } = await db.query(
    `SELECT tags FROM inventory WHERE tags IS NOT NULL AND tags != ''`
  );
  return rows.map(r => r.tags);
}
