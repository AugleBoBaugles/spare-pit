// Business logic for areas and locations. Sits between locationController and locationModel.
// Errors thrown here carry an HTTP `status` that the controller passes straight through.
import {
  getAllAreas,
  findAreaById,
  findAreaByName,
  insertArea,
  renameArea,
  findUnassignClashes,
  deleteAreaById,
  getAllLocations,
  findLocationById,
  findLocationByName,
  insertLocation,
  updateLocation,
  deleteLocationById,
} from '../models/locationModel.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Trims a name and rejects anything that isn't a non-empty string.
function cleanName(name, what) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw httpError(400, `${what} name is required and must be a non-empty string`);
  }
  return name.trim();
}

// "Machine Shop" or "Unassigned", for error messages about where a location is.
async function areaLabel(areaId) {
  if (areaId === null) return 'Unassigned';
  return (await findAreaById(areaId))?.name ?? 'That area';
}

async function duplicateLocationError(name, areaId) {
  return httpError(409, `${await areaLabel(areaId)} already has a location named "${name}"`);
}

// Returns everything the Locations page needs in one go.
export async function getLocationsOverviewService() {
  const [areas, locations] = await Promise.all([getAllAreas(), getAllLocations()]);
  return { areas, locations };
}

// ─── Areas ───────────────────────────────────────────────────────────────────

export async function createAreaService(name) {
  const clean = cleanName(name, 'Area');
  if (await findAreaByName(clean)) throw httpError(409, `An area named "${clean}" already exists`);
  return insertArea(clean);
}

export async function renameAreaService(id, name) {
  const clean = cleanName(name, 'Area');
  if (!(await findAreaById(id))) throw httpError(404, 'Area not found');
  const clash = await findAreaByName(clean);
  if (clash && clash.id !== Number(id)) throw httpError(409, `An area named "${clean}" already exists`);
  return renameArea(id, clean);
}

// Deleting an area never deletes its locations or items; the locations become unassigned.
// Refused if one of them has the same name as a location that's already unassigned.
export async function deleteAreaService(id) {
  const area = await findAreaById(id);
  if (!area) throw httpError(404, 'Area not found');
  const clashes = await findUnassignClashes(area.id);
  if (clashes.length > 0) {
    const names = clashes.map(n => `"${n}"`).join(', ');
    throw httpError(409,
      `Can't delete "${area.name}": its locations would become unassigned, and Unassigned already has ${names}. ` +
      'Rename or move those locations first.');
  }
  await deleteAreaById(area.id);
  return area;
}

// ─── Locations ───────────────────────────────────────────────────────────────

// areaId may be null (unassigned); otherwise it must name an existing area.
async function checkAreaId(areaId) {
  if (areaId === null) return null;
  if (!Number.isInteger(areaId) || !(await findAreaById(areaId))) {
    throw httpError(400, 'areaId must be the id of an existing area, or null');
  }
  return areaId;
}

// Location names only have to be unique within their area.
export async function createLocationService({ name, areaId = null }) {
  const clean = cleanName(name, 'Location');
  const area = await checkAreaId(areaId);
  if (await findLocationByName(clean, area)) throw await duplicateLocationError(clean, area);
  return insertLocation(clean, area);
}

// `changes` may hold `name` (rename) and/or `areaId` (move to another area, null = unassigned).
// Refused if the location would end up next to another one with the same name.
export async function updateLocationService(id, changes) {
  const current = await findLocationById(id);
  if (!current) throw httpError(404, 'Location not found');

  const fields = {};
  if (changes.name !== undefined) fields.name = cleanName(changes.name, 'Location');
  if (changes.areaId !== undefined) fields.areaId = await checkAreaId(changes.areaId);
  if (Object.keys(fields).length === 0) {
    throw httpError(400, 'Request body must include name and/or areaId');
  }

  const name = fields.name ?? current.name;
  const areaId = fields.areaId !== undefined ? fields.areaId : current.areaId;
  const clash = await findLocationByName(name, areaId);
  if (clash && clash.id !== current.id) throw await duplicateLocationError(name, areaId);

  return updateLocation(current.id, fields);
}

// Only empty locations can be deleted, so no item is ever left somewhere that doesn't exist.
export async function deleteLocationService(id) {
  const location = await findLocationById(id);
  if (!location) throw httpError(404, 'Location not found');
  if (location.itemCount > 0) {
    throw httpError(409, `"${location.name}" still has ${location.itemCount} item(s). Move them before deleting it.`);
  }
  await deleteLocationById(location.id);
  return location;
}

// Throws a 400 unless `locationId` is null (no location) or the id of an existing location.
export async function checkLocationId(locationId) {
  if (locationId === null) return;
  if (!Number.isInteger(locationId) || !(await findLocationById(locationId))) {
    throw httpError(400, 'locationId must be the id of an existing location, or null');
  }
}

// Used by the seed script: returns the id of the location `name` in the area `areaName`
// (null/empty = unassigned), creating the area and location if they don't exist yet.
export async function ensureLocation(name, areaName) {
  let areaId = null;
  if (areaName && areaName.trim()) {
    const area = (await findAreaByName(areaName.trim())) ?? (await insertArea(areaName.trim()));
    areaId = area.id;
  }
  const location = (await findLocationByName(name.trim(), areaId)) ?? (await insertLocation(name.trim(), areaId));
  return location.id;
}
