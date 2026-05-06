import { getAllInventory } from '../models/inventoryModel.js';

export async function getAllInventoryService() {
    const inventory = await getAllInventory();
    return inventory;
}

export async function postInventoryService(item) {
    // Placeholder for future implementation of adding a new tool to the inventory
    return { success: true, item };
}