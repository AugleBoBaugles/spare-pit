// HTTP layer for areas and locations. Each function maps to one route in locationRoutes.js.
// Validation lives in locationService; its errors carry the HTTP status to respond with.
import {
  getLocationsOverviewService,
  createAreaService,
  renameAreaService,
  deleteAreaService,
  createLocationService,
  updateLocationService,
  deleteLocationService,
} from '../services/locationService.js';

// Wraps a handler so service errors become JSON responses: the error's own status and
// message when it has one (400/404/409), otherwise a generic 500 with `fallback`.
function handle(fallback, fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err.code === 'MISSING_DB_CONFIG') {
        return res.status(503).json({ error: 'The server is not connected to a database. Check server/.env.' });
      }
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error(`${fallback}:`, err);
      res.status(500).json({ error: fallback });
    }
  };
}

// GET /api/locations — { areas: [{ id, name }], locations: [{ id, name, areaId, itemCount }] }
export const getLocations = handle('Failed to retrieve locations', async (req, res) => {
  res.status(200).json(await getLocationsOverviewService());
});

// POST /api/areas — body: { name }
export const postArea = handle('Failed to create area', async (req, res) => {
  res.status(201).json(await createAreaService(req.body.name));
});

// PATCH /api/areas/:id — body: { name }
export const patchArea = handle('Failed to rename area', async (req, res) => {
  res.status(200).json(await renameAreaService(req.params.id, req.body.name));
});

// DELETE /api/areas/:id — its locations become unassigned
export const deleteArea = handle('Failed to delete area', async (req, res) => {
  res.status(200).json({ deleted: await deleteAreaService(req.params.id) });
});

// POST /api/locations — body: { name, areaId? }
export const postLocation = handle('Failed to create location', async (req, res) => {
  res.status(201).json(await createLocationService(req.body));
});

// PATCH /api/locations/:id — body: { name?, areaId? }
export const patchLocation = handle('Failed to update location', async (req, res) => {
  const { name, areaId } = req.body;
  res.status(200).json(await updateLocationService(req.params.id, { name, areaId }));
});

// DELETE /api/locations/:id — only allowed when no items are stored there
export const deleteLocation = handle('Failed to delete location', async (req, res) => {
  res.status(200).json({ deleted: await deleteLocationService(req.params.id) });
});
