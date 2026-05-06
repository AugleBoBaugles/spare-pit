import { getAllInventoryService } from "../services/inventoryService.js";

export const getAllInventory = async (req, res) => {
    try {
        const inventory = await getAllInventoryService();
        res.status(200).json(inventory);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ error: 'Failed to retrieve inventory items' });
    }
};

export const postTool = async (req, res) => {
    // Placeholder for future implementation of adding a new tool to the inventory
    res.status(501).json({ error: 'Not implemented' });
}