// Supabase data access layer. All direct database queries live here.
// To switch to local SQLite, see inventoryModel.sqlite.js and README → "Local SQLite Development".
import { getDb } from '../db/db.js';

// Converts a lastUpdated value to an ISO 8601 string required by Supabase's timestamptz column.
// Accepts a Unix ms timestamp (Date.now()), an existing ISO string, or null.
function normalizeTimestamp(value) {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : new Date(value).toISOString();
}

// Returns every row in the inventory table, sorted by id ascending.
export async function getAllInventory() {
  const db = getDb();
  const { data, error } = await db.from('inventory').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Case-insensitive name lookup used for duplicate detection on insert.
// Returns the first matching row, or null if none found.
export async function findInventoryByName(name) {
  const db = getDb();
  const { data, error } = await db
    .from('inventory')
    .select('*')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

// Overwrites the given fields on a single row identified by id.
// Returns the full updated row as stored in Supabase.
export async function updateInventoryItem(id, fields) {
  const db = getDb();
  const normalizedFields = {
    ...fields,
    lastUpdated: normalizeTimestamp(fields.lastUpdated)
  };

  const { data, error } = await db
    .from('inventory')
    .update(normalizedFields)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Returns an array of unique, non-empty checkOutBy values across all rows.
// Used to populate the subteams dropdown in the UI.
export async function getDistinctSubteams() {
  const db = getDb();
  const { data, error } = await db
    .from('inventory')
    .select('checkOutBy')
    .neq('checkOutBy', '')
    .not('checkOutBy', 'is', null)
    .order('checkOutBy', { ascending: true });

  if (error) throw error;
  const values = data?.map(row => row.checkOutBy) ?? [];
  return Array.from(new Set(values));
}

// Inserts a new inventory item and returns the created row (including the generated id).
export async function insertInventoryItem(item) {
  const db = getDb();
  const insertPayload = {
    ...item,
    lastUpdated: normalizeTimestamp(item.lastUpdated)
  };

  const { data, error } = await db
    .from('inventory')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Fetches a single row by primary key. Returns null if the id does not exist.
export const findInventoryById = async (id) => {
  const db = getDb();
  const { data, error } = await db
    .from('inventory')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

// Deletes the row with the given id. Returns true on success.
export const deleteInventoryById = async (id) => {
  const db = getDb();
  const { error } = await db
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
