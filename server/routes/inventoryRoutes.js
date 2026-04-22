import express from 'express';

const inventoryRouter = express.Router();

inventoryRouter.get('/inventory', (req, res) => {
  res.send('Get all inventory items');
});

export default inventoryRouter;