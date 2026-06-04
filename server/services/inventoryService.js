// Business logic layer. Sits between controllers and the model.
// To switch to SQLite, also update the model import to './inventoryModel.sqlite.js'
// and see README → "Local SQLite Development".
import {
  getAllInventory,
  findInventoryByName,
  insertInventoryItem,
  getDistinctSubteams,
  findInventoryById,
  updateInventoryItem,
  deleteInventoryById
} from '../models/inventoryModel.js';

// Columns that controllers are allowed to write via PATCH or POST.
// id and lastUpdated are intentionally excluded: id is auto-generated,
// lastUpdated is always set by the service layer to the current timestamp.
export const patchableColumns = [
  'name', 'type', 'area', 'location', 'status',
  'quantity', 'condition', 'itemImage', 'checkOutBy', 'tags', 'notes', 'needsRestock'
];

// Returns all inventory items.
export async function getAllInventoryService() {
  return getAllInventory();
}

// Updates an existing item by id. Automatically sets lastUpdated to now.
// Throws a 404 error if no item with the given id exists.
export async function patchInventoryService(id, updates) {
  const existing = await findInventoryById(id);
  if (!existing) {
    const err = new Error(`Inventory item with ID ${id} not found`);
    err.status = 404;
    throw err;
  }
  return updateInventoryItem(id, { ...updates, lastUpdated: Date.now() });
}

// Returns all distinct non-empty checkOutBy values (used for the subteams dropdown).
export async function getSubteamsService() {
  return getDistinctSubteams();
}

// Inserts a new item. Returns the new item plus a possibleDuplicate field
// (populated when another item with the same name already exists).
export async function postInventoryService(item) {
  const possibleDuplicate = await findInventoryByName(item.name);
  const newItem = await insertInventoryItem({ ...item, lastUpdated: Date.now() });
  return { ...newItem, possibleDuplicate: possibleDuplicate ?? null };
}

// Deletes an item by id. Returns the deleted item so the caller can confirm what was removed.
// Throws a plain Error (no status code) if the item is not found — controller maps this to 404.
export const deleteInventoryService = async (id) => {
  const inventory = await findInventoryById(id);

  if (!inventory) {
    throw new Error('Inventory item not found');
  }

  await deleteInventoryById(id);
  return inventory;
};
