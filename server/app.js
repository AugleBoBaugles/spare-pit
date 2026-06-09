// Express app setup. Registers middleware and mounts route handlers.
// Entry point is server.js, which calls app.listen().
import express from 'express';
import cors from 'cors';
import inventoryRouter from './routes/inventoryRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
}));
app.use(express.json());
app.use('/api', inventoryRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Spare Pit API!');
});

export default app;