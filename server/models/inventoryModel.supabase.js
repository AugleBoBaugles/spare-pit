// PostgreSQL data access layer (Supabase or self-hosted, via pg driver).
// Selected automatically by inventoryModel.js when DB_CLIENT=postgres.
// Columns itemImage, checkOutBy, lastUpdated, needsRestock and locationId are camelCase and must be double-quoted
// in SQL because PostgreSQL folds unquoted identifiers to lowercase.
import { getDb } from '../db/db.js';

// Items store only a locationId. Each row also gets its location's name, and the id and
// name of the area that location is in (all null when the item has no location).
const SELECT_ITEMS = `
  SELECT i.*, l.name AS location, l."areaId" AS "areaId", a.name AS area
  FROM inventory i
  LEFT JOIN locations l ON l.id = i."locationId"
  LEFT JOIN areas a ON a.id = l."areaId"`;

// pg returns bigint columns as strings; the frontend compares location and area ids as numbers.
function toItem(row) {
  if (!row) return null;
  return {
    ...row,
    locationId: row.locationId === null ? null : Number(row.locationId),
    areaId: row.areaId === null ? null : Number(row.areaId),
  };
}

// Columns whose names must be double-quoted in SQL to preserve camelCase casing.
const QUOTED_COLS = new Set(['itemImage', 'checkOutBy', 'lastUpdated', 'needsRestock', 'locationId']);

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
  const { rows } = await db.query(`${SELECT_ITEMS} ORDER BY i.id ASC`);
  return rows.map(toItem);
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
  const { rows } = await db.query(`${SELECT_ITEMS} WHERE i.id = $1`, [id]);
  return toItem(rows[0]);
};

// Inserts a new inventory item and returns the created row (including the generated id).
export async function insertInventoryItem(item) {
  const db = getDb();
  const { rows } = await db.query(
    `INSERT INTO inventory
       (name, type, "locationId", status, quantity, condition, "itemImage", "checkOutBy", "lastUpdated", tags, notes, "needsRestock")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      item.name,
      item.type         ?? null,
      item.locationId   ?? null,
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
  return findInventoryById(rows[0].id);
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
    `UPDATE inventory SET ${setClauses} WHERE id = $${entries.length + 1} RETURNING id`,
    values
  );
  return rows[0] ? findInventoryById(rows[0].id) : undefined;
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
