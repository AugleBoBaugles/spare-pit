// Backend-agnostic model entry point. Re-exports the SQLite or Postgres model
// based on DB_CLIENT (see db/config.js), so nothing else needs to know which one is active.
import { DB_CLIENT } from '../db/config.js';

const model = DB_CLIENT === 'sqlite'
  ? await import('./inventoryModel.sqlite.js')
  : await import('./inventoryModel.supabase.js');

export const {
  getAllInventory,
  findInventoryByName,
  insertInventoryItem,
  getDistinctSubteams,
  findInventoryById,
  updateInventoryItem,
  deleteInventoryById,
  getAllTagStrings,
} = model;
