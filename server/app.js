import express from 'express';
import inventoryRouter from './routes/inventoryRoutes.js';

const app = express();

app.use(express.json());
app.use('/api', inventoryRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Spare Pit API!');
});

export default app;