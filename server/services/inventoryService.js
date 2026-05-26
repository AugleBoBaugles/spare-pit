import { getAllInventory, findInventoryByName, insertInventoryItem, getDistinctSubteams, getInventoryColumns, findInventoryById, updateInventoryItem } from '../models/inventoryModel.js';

/*
Returns an array of all inventory items in the database. Each item includes all fields defined in the inventory schema.
*/
export async function getAllInventoryService() {
    const inventory = await getAllInventory();
    return inventory;
}

const NON_PATCHABLE = ['id', 'lastUpdated'];
export const patchableColumns = (await getInventoryColumns()).filter(col => !NON_PATCHABLE.includes(col));

/*
Updates an existing inventory item by ID with the provided fields.
Throws a 404 error if no item with the given ID exists.
Returns the updated item.
*/
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

/*
Returns the new item along with any possible duplicate (same name) found in the inventory.
*/
export async function postInventoryService(item) {
    const possibleDuplicate = await findInventoryByName(item.name);
    const newItem = await insertInventoryItem({ ...item, lastUpdated: Date.now() });

    return { ...newItem, possibleDuplicate: possibleDuplicate ? possibleDuplicate : null };
}