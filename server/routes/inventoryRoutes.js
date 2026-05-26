import express from 'express';
import { getAllInventory, postTool, patchInventory, getSubteams} from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory/subteams', getSubteams);
inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.patch('/inventory/:id', patchInventory);

export default inventoryRouter;