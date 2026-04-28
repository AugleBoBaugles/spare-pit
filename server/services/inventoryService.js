import { getAllInventory } from '../models/inventoryModel.js';

export async function getAllInventoryService() {
    const inventory = await getAllInventory();
    return inventory;
}