import express from 'express';
import { getAllInventory, postTool, patchInventory } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.patch('/inventory/:id', patchInventory);

export default inventoryRouter;