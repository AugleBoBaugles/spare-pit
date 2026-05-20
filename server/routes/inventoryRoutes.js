import express from 'express';
import { getAllInventory, postTool } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.patch('/inventory/:id', (req, res) => {
    return res.status(200).json({message: 'PATCH endpoint for updating inventory item by ID - to be implemented'});
})

export default inventoryRouter;