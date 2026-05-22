import { getAllInventoryService, postInventoryService, patchableColumns, patchInventoryService } from "../services/inventoryService.js";

/*
 * GET /inventory - Retrieve all inventory items
 */
export const getAllInventory = async (req, res) => {
    try {
        const inventory = await getAllInventoryService();
        res.status(200).json(inventory);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ error: 'Failed to retrieve inventory items' });
    }
};

/*
 * POST /inventory - Add a new tool to the inventory

    * Expected JSON body:   
    {
        "name": "Tool Name",          // required
        "type": "Tool Type",
        "area": "Storage Area",
        "location": "Specific Location",
        "status": "available/checked out/needs repair",
        "quantity": 5,               // must be a non-negative integer
        "condition": "good/fair/poor",
        "itemImage": "images/image.jpg",
        "checkOutBy": "Person Name",
        "tags": "tag1, tag2",
        "notes": "Additional notes about the tool"
    }
*/
export const postTool = async (req, res) => {
    const VALID_FIELDS = [
        'name', 'type', 'area', 'location', 'status',
        'quantity', 'condition', 'itemImage', 'checkOutBy', 'tags', 'notes'
    ];

    const item = {};
    for (const field of VALID_FIELDS) {
        if (req.body[field] !== undefined) {
            item[field] = req.body[field];
        }
    }

    // Validate required field
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: 'name is required and must be a non-empty string' });
    }

    // Validate quantity is a number if provided
    if (item.quantity !== undefined && (!Number.isInteger(item.quantity) || item.quantity < 0)) {
        return res.status(400).json({ error: 'quantity must be a non-negative integer' });
    }

    try {
        const result = await postInventoryService(item);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error posting tool:', err);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
}

/*
PATCH /inventory/:id - Update an existing inventory item
Expected JSON body can include any of the following fields to update:
{
    "name": "Updated Tool Name",
    "type": "Updated Tool Type",
    "area": "Updated Storage Area",
    "location": "Updated Specific Location",
    "status": "available/checked out/needs repair",
    "quantity": 5,               // must be a non-negative integer
    "condition": "good/fair/poor",
    "itemImage": "images/updated_image.jpg",
    "checkOutBy": "Updated Person Name",
    "tags": "updated_tag1, updated_tag2",
    "notes": "Updated notes about the tool"
}   
 */
export const patchInventory = async (req, res) => {
    const id = req.params.id;

    const updates = {};
    for (const field of patchableColumns) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: `Request body must include at least one valid field: ${patchableColumns.join(', ')}` });
    }

    // Validate quantity is a number if provided
    if (updates.quantity !== undefined && (!Number.isInteger(updates.quantity) || updates.quantity < 0)) {
        return res.status(400).json({ error: 'quantity must be a non-negative integer' });
    }

    try {
        const updated = await patchInventoryService(id, updates);
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error patching inventory:', err);
        res.status(err.status || 500).json({ error: err.message || 'Failed to update inventory item' });
    }
}   