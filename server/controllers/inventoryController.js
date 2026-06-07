// HTTP layer. Receives requests, calls services, and sends responses.
// Each function maps to one route defined in inventoryRoutes.js.
import {
  getAllInventoryService,
  postInventoryService,
  getSubteamsService,
  patchableColumns,
  patchInventoryService,
  deleteInventoryService,
  getTagsService,
} from '../services/inventoryService.js';

// Returns true and sends a 503 response when DATABASE_URL is not configured.
// Call at the top of every catch block so misconfiguration surfaces clearly to the frontend.
function missingDbConfig(err, res) {
  if (err.code !== 'MISSING_DB_CONFIG') return false;
  res.status(503).json({
    error: 'The server is not connected to a database. Ensure DATABASE_URL is set in server/.env and points to a valid Supabase transaction connection string.',
  });
  return true;
}

// GET /api/inventory/tags — deduplicated, sorted list of all tag strings
export const getTags = async (req, res) => {
  try {
    const tags = await getTagsService();
    res.status(200).json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
};

// GET /api/inventory — all inventory items
export const getAllInventory = async (req, res) => {
  try {
    const inventory = await getAllInventoryService();
    res.status(200).json(inventory);
  } catch (err) {
    if (missingDbConfig(err, res)) return;
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to retrieve inventory items' });
  }
};

// GET /api/inventory/subteams — distinct checkOutBy values for autocomplete
export const getSubteams = async (req, res) => {
  try {
    const subteams = await getSubteamsService();
    res.status(200).json(subteams);
  } catch (err) {
    if (missingDbConfig(err, res)) return;
    console.error('Error fetching subteams:', err);
    res.status(500).json({ error: 'Failed to retrieve subteams' });
  }
};

// POST /api/inventory — add a new inventory item
// Required body field: name (string). Optional: type, area, location, status,
// quantity (non-negative integer), condition, itemImage, checkOutBy, tags, notes.
export const postTool = async (req, res) => {
  const VALID_FIELDS = [
    'name', 'type', 'area', 'location', 'status',
    'quantity', 'condition', 'itemImage', 'checkOutBy', 'tags', 'notes',
  ];

  const item = {};
  for (const field of VALID_FIELDS) {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  }

  if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
    return res.status(400).json({ error: 'name is required and must be a non-empty string' });
  }
  if (item.quantity !== undefined && (!Number.isInteger(item.quantity) || item.quantity < 0)) {
    return res.status(400).json({ error: 'quantity must be a non-negative integer' });
  }

  try {
    const result = await postInventoryService(item);
    res.status(201).json(result);
  } catch (err) {
    if (missingDbConfig(err, res)) return;
    console.error('Error posting tool:', err);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
};

// DELETE /api/inventory/:id — permanently remove an item
export const deleteTool = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ error: 'ID parameter is required' });

  try {
    const deletedItem = await deleteInventoryService(id);
    return res.status(200).json({
      message: `${deletedItem.name} has been deleted from the inventory`,
      deleted: deletedItem,
    });
  } catch (err) {
    if (missingDbConfig(err, res)) return;
    console.error('Error deleting inventory item:', err);
    if (err.message === 'Inventory item not found') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    return res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

// PATCH /api/inventory/:id — update one or more fields on an existing item
// Body can include any subset of: name, type, area, location, status, quantity,
// condition, itemImage, checkOutBy, tags, notes, needsRestock.
export const patchInventory = async (req, res) => {
  const { id } = req.params;

  const updates = {};
  for (const field of patchableColumns) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: `Request body must include at least one valid field: ${patchableColumns.join(', ')}`,
    });
  }
  if (updates.quantity !== undefined && (!Number.isInteger(updates.quantity) || updates.quantity < 0)) {
    return res.status(400).json({ error: 'quantity must be a non-negative integer' });
  }

  try {
    const updated = await patchInventoryService(id, updates);
    res.status(200).json(updated);
  } catch (err) {
    if (missingDbConfig(err, res)) return;
    console.error('Error patching inventory:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to update inventory item' });
  }
};
