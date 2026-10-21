// Maps area and location API paths to controller functions. Mounted under /api in app.js.
import express from 'express';
import {
  getLocations, postArea, patchArea, deleteArea,
  postLocation, patchLocation, deleteLocation,
} from '../controllers/locationController.js';

const locationRouter = express.Router();

locationRouter.get('/locations', getLocations);
locationRouter.post('/locations', postLocation);
locationRouter.patch('/locations/:id', patchLocation);
locationRouter.delete('/locations/:id', deleteLocation);

locationRouter.post('/areas', postArea);
locationRouter.patch('/areas/:id', patchArea);
locationRouter.delete('/areas/:id', deleteArea);

export default locationRouter;
