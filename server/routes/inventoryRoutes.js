import express from 'express';
import { getAllInventory, postTool, deleteTool } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.delete('/inventory/:id', deleteTool);

export default inventoryRouter;