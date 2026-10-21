// PostgreSQL data access for areas and locations (Supabase or self-hosted, via pg driver).
// Selected automatically by locationModel.js when DB_CLIENT=postgres.
// Names compare ignoring case (see supabase-schema.sql), so lookups compare lower(name).
// "areaId" and "locationId" are camelCase and must be double-quoted in SQL.
import { getDb } from '../db/db.js';

// pg returns bigint columns as strings; the frontend compares ids as numbers.
function toArea(row) {
  return row ? { id: Number(row.id), name: row.name } : null;
}

function toLocation(row) {
  return row
    ? {
        id: Number(row.id),
        name: row.name,
        areaId: row.areaId === null ? null : Number(row.areaId),
        itemCount: Number(row.itemCount),
      }
    : null;
}

// ─── Areas ───────────────────────────────────────────────────────────────────

// Returns every area, alphabetical.
export async function getAllAreas() {
  const { rows } = await getDb().query('SELECT id, name FROM areas ORDER BY lower(name)');
  return rows.map(toArea);
}

export async function findAreaById(id) {
  const { rows } = await getDb().query('SELECT id, name FROM areas WHERE id = $1', [id]);
  return toArea(rows[0]);
}

// Case-insensitive lookup, used for duplicate checks.
export async function findAreaByName(name) {
  const { rows } = await getDb().query('SELECT id, name FROM areas WHERE lower(name) = lower($1)', [name]);
  return toArea(rows[0]);
}

export async function insertArea(name) {
  const { rows } = await getDb().query('INSERT INTO areas (name) VALUES ($1) RETURNING id, name', [name]);
  return toArea(rows[0]);
}

export async function renameArea(id, name) {
  const { rows } = await getDb().query('UPDATE areas SET name = $1 WHERE id = $2 RETURNING id, name', [name, id]);
  return toArea(rows[0]);
}

// Names of this area's locations that an unassigned location already uses — these
// would clash if the area were deleted and its locations became unassigned.
export async function findUnassignClashes(areaId) {
  const { rows } = await getDb().query(
    `SELECT l.name FROM locations l
     WHERE l."areaId" = $1
       AND EXISTS (SELECT 1 FROM locations u WHERE u."areaId" IS NULL AND lower(u.name) = lower(l.name))
     ORDER BY lower(l.name)`,
    [areaId]
  );
  return rows.map(r => r.name);
}

// Deletes an area. Its locations stay, but become unassigned (the foreign key is ON DELETE SET NULL).
export async function deleteAreaById(id) {
  await getDb().query('DELETE FROM areas WHERE id = $1', [id]);
}

// ─── Locations ───────────────────────────────────────────────────────────────

// Each location comes with "itemCount": how many inventory rows are stored there.
const SELECT_LOCATIONS = `
  SELECT l.id, l.name, l."areaId",
         (SELECT COUNT(*) FROM inventory i WHERE i."locationId" = l.id) AS "itemCount"
  FROM locations l`;

// Returns every location, alphabetical.
export async function getAllLocations() {
  const { rows } = await getDb().query(`${SELECT_LOCATIONS} ORDER BY lower(l.name)`);
  return rows.map(toLocation);
}

export async function findLocationById(id) {
  const { rows } = await getDb().query(`${SELECT_LOCATIONS} WHERE l.id = $1`, [id]);
  return toLocation(rows[0]);
}

// Case-insensitive lookup within one area (areaId null = the unassigned locations).
export async function findLocationByName(name, areaId) {
  const { rows } = await getDb().query(
    `${SELECT_LOCATIONS} WHERE lower(l.name) = lower($1) AND coalesce(l."areaId", 0) = coalesce($2::bigint, 0)`,
    [name, areaId]
  );
  return toLocation(rows[0]);
}

export async function insertLocation(name, areaId = null) {
  const { rows } = await getDb().query(
    'INSERT INTO locations (name, "areaId") VALUES ($1, $2) RETURNING id',
    [name, areaId]
  );
  return findLocationById(rows[0].id);
}

// Updates a location's name and/or areaId. Items point at the location by id, so they
// follow along automatically.
export async function updateLocation(id, { name, areaId }) {
  const db = getDb();
  if (name !== undefined) await db.query('UPDATE locations SET name = $1 WHERE id = $2', [name, id]);
  if (areaId !== undefined) await db.query('UPDATE locations SET "areaId" = $1 WHERE id = $2', [areaId, id]);
  return findLocationById(id);
}

export async function deleteLocationById(id) {
  await getDb().query('DELETE FROM locations WHERE id = $1', [id]);
}
