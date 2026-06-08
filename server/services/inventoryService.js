// Business logic layer. Sits between controllers and models.
// All validation and data shaping that isn't raw SQL lives here.
import {
  getAllInventory,
  findInventoryByName,
  insertInventoryItem,
  getDistinctSubteams,
  findInventoryById,
  updateInventoryItem,
  deleteInventoryById,
  getAllTagStrings,
} from '../models/inventoryModel.supabase.js';

// Columns that controllers are allowed to write via PATCH or POST.
// id and lastUpdated are excluded: id is auto-generated,
// lastUpdated is always set by the service layer to the current timestamp.
export const patchableColumns = [
  'name', 'type', 'area', 'location', 'status',
  'quantity', 'condition', 'itemImage', 'checkOutBy', 'tags', 'notes', 'needsRestock',
];

export async function getAllInventoryService() {
  return getAllInventory();
}

// Throws a 404 error if no item with the given ID exists.
export async function patchInventoryService(id, updates) {
  const existing = await findInventoryById(id);
  if (!existing) {
    const err = new Error(`Inventory item with ID ${id} not found`);
    err.status = 404;
    throw err;
  }
  return updateInventoryItem(id, { ...updates, lastUpdated: Date.now() });
}

export async function getSubteamsService() {
  return getDistinctSubteams();
}

// Parses every item's tags string, deduplicates across items, and returns
// a sorted lowercase array — e.g. ["battery", "motor", "power"].
export async function getTagsService() {
  const rawStrings = await getAllTagStrings();
  const tagSet = new Set();
  for (const raw of rawStrings) {
    for (const token of raw.split(',')) {
      const trimmed = token.trim().toLowerCase();
      if (trimmed) tagSet.add(trimmed);
    }
  }
  return [...tagSet].sort();
}

// Returns the new item along with any possible duplicate (same name, case-insensitive).
export async function postInventoryService(item) {
  const possibleDuplicate = await findInventoryByName(item.name);
  const newItem = await insertInventoryItem({ ...item, lastUpdated: Date.now() });
  return { ...newItem, possibleDuplicate: possibleDuplicate ?? null };
}

// Throws if no item with the given ID exists. Returns the deleted item.
export const deleteInventoryService = async (id) => {
  const inventory = await findInventoryById(id);
  if (!inventory) {
    throw new Error('Inventory item not found');
  }
  await deleteInventoryById(id);
  return inventory;
};
