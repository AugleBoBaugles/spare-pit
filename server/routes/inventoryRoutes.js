import express from 'express';
import { getAllInventory, postTool } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);

export default inventoryRouter;