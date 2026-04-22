import express from 'express';
import { getAllInventory } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);

export default inventoryRouter;