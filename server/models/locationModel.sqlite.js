// SQLite data access for areas and locations. Selected automatically by locationModel.js
// when DB_CLIENT=sqlite. Name columns are COLLATE NOCASE, so every name comparison
// below ignores case.
import { getDb } from '../db/db.sqlite.js';

// ─── Areas ───────────────────────────────────────────────────────────────────

// Returns every area, alphabetical.
export async function getAllAreas() {
  const db = await getDb();
  return db.all('SELECT id, name FROM areas ORDER BY name');
}

export async function findAreaById(id) {
  const db = await getDb();
  return (await db.get('SELECT id, name FROM areas WHERE id = ?', id)) ?? null;
}

// Case-insensitive lookup, used for duplicate checks.
export async function findAreaByName(name) {
  const db = await getDb();
  return (await db.get('SELECT id, name FROM areas WHERE name = ?', name)) ?? null;
}

export async function insertArea(name) {
  const db = await getDb();
  const result = await db.run('INSERT INTO areas (name) VALUES (?)', name);
  return findAreaById(result.lastID);
}

export async function renameArea(id, name) {
  const db = await getDb();
  await db.run('UPDATE areas SET name = ? WHERE id = ?', name, id);
  return findAreaById(id);
}

// Names of this area's locations that an unassigned location already uses — these
// would clash if the area were deleted and its locations became unassigned.
export async function findUnassignClashes(areaId) {
  const db = await getDb();
  const rows = await db.all(
    `SELECT l.name FROM locations l
     WHERE l.areaId = ?
       AND EXISTS (SELECT 1 FROM locations u WHERE u.areaId IS NULL AND u.name = l.name)
     ORDER BY l.name`,
    areaId
  );
  return rows.map(r => r.name);
}

// Deletes an area. Its locations stay, but become unassigned.
// (SQLite doesn't enforce ON DELETE SET NULL unless foreign keys are switched on, so do it here.)
export async function deleteAreaById(id) {
  const db = await getDb();
  await db.exec('BEGIN');
  try {
    await db.run('UPDATE locations SET areaId = NULL WHERE areaId = ?', id);
    await db.run('DELETE FROM areas WHERE id = ?', id);
    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

// ─── Locations ───────────────────────────────────────────────────────────────

// Each location comes with itemCount: how many inventory rows are stored there.
const SELECT_LOCATIONS = `
  SELECT l.id, l.name, l.areaId,
         (SELECT COUNT(*) FROM inventory i WHERE i.locationId = l.id) AS itemCount
  FROM locations l`;

// Returns every location, alphabetical.
export async function getAllLocations() {
  const db = await getDb();
  return db.all(`${SELECT_LOCATIONS} ORDER BY l.name`);
}

export async function findLocationById(id) {
  const db = await getDb();
  return (await db.get(`${SELECT_LOCATIONS} WHERE l.id = ?`, id)) ?? null;
}

// Case-insensitive lookup within one area (areaId null = the unassigned locations).
export async function findLocationByName(name, areaId) {
  const db = await getDb();
  return (await db.get(
    `${SELECT_LOCATIONS} WHERE l.name = ? AND IFNULL(l.areaId, 0) = IFNULL(?, 0)`,
    name, areaId
  )) ?? null;
}

export async function insertLocation(name, areaId = null) {
  const db = await getDb();
  const result = await db.run('INSERT INTO locations (name, areaId) VALUES (?, ?)', name, areaId);
  return findLocationById(result.lastID);
}

// Updates a location's name and/or areaId. Items point at the location by id, so they
// follow along automatically.
export async function updateLocation(id, { name, areaId }) {
  const db = await getDb();
  if (name !== undefined) await db.run('UPDATE locations SET name = ? WHERE id = ?', name, id);
  if (areaId !== undefined) await db.run('UPDATE locations SET areaId = ? WHERE id = ?', areaId, id);
  return findLocationById(id);
}

export async function deleteLocationById(id) {
  const db = await getDb();
  await db.run('DELETE FROM locations WHERE id = ?', id);
}
