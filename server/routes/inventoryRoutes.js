import express from 'express';
import { getAllInventory, postTool } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', getAllInventory);
inventoryRouter.post('/inventory', postTool);
inventoryRouter.delete('/inventory/:id', (req, res) => {
    const id = req.params.id;
    res.status(200).send(`Delete inventory item with ID: ${id}`);
});

export default inventoryRouter;