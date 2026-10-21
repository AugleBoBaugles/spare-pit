// Backend-agnostic entry point for area and location queries. Re-exports the SQLite or
// Postgres model based on DB_CLIENT (see db/config.js), like inventoryModel.js.
import { DB_CLIENT } from '../db/config.js';

const model = DB_CLIENT === 'sqlite'
  ? await import('./locationModel.sqlite.js')
  : await import('./locationModel.supabase.js');

export const {
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
} = model;
