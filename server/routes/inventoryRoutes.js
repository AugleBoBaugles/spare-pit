// Maps API URL paths to controller functions.
// All routes are mounted under /api in app.js, so /inventory resolves to /api/inventory.
import express from 'express';
import { getAllInventory, postTool, patchInventory, getSubteams, deleteTool, getTags } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory/subteams', getSubteams);
inventoryRouter.get('/inventory/tags', getTags);
inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.delete('/inventory/:id', deleteTool);
inventoryRouter.patch('/inventory/:id', patchInventory);

export default inventoryRouter;