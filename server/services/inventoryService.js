import { getAllInventory, findInventoryByName, insertInventoryItem, getDistinctSubteams } from '../models/inventoryModel.js';

/*
Returns an array of all inventory items in the database. Each item includes all fields defined in the inventory schema.
*/
export async function getAllInventoryService() {
    const inventory = await getAllInventory();
    return inventory;
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