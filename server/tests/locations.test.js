// tests/locations.test.js — area and location routes, with the service layer mocked.
import { jest } from '@jest/globals';

const mockGetLocationsOverviewService = jest.fn();
const mockCreateAreaService = jest.fn();
const mockRenameAreaService = jest.fn();
const mockDeleteAreaService = jest.fn();
const mockCreateLocationService = jest.fn();
const mockUpdateLocationService = jest.fn();
const mockDeleteLocationService = jest.fn();

await jest.unstable_mockModule('../services/locationService.js', () => ({
  getLocationsOverviewService: mockGetLocationsOverviewService,
  createAreaService: mockCreateAreaService,
  renameAreaService: mockRenameAreaService,
  deleteAreaService: mockDeleteAreaService,
  createLocationService: mockCreateLocationService,
  updateLocationService: mockUpdateLocationService,
  deleteLocationService: mockDeleteLocationService,
  ensureLocation: jest.fn(),
  checkLocationId: jest.fn(),
}));

// Dynamic imports MUST come after unstable_mockModule
const { default: app } = await import('../app.js');
const { default: request } = await import('supertest');

// Builds an error shaped like the ones locationService throws.
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

const overview = {
  areas: [{ id: 1, name: 'Machine Shop' }],
  locations: [
    { id: 1, name: 'Tool Cabinet A', areaId: 1, itemCount: 2 },
    { id: 2, name: 'Loose Shelf', areaId: null, itemCount: 0 },
  ],
};

afterEach(() => jest.resetAllMocks());

describe('GET /api/locations', () => {
  test('200: returns areas and locations', async () => {
    mockGetLocationsOverviewService.mockResolvedValue(overview);

    const res = await request(app).get('/api/locations');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(overview);
  });

  test('500: generic error when the service fails unexpectedly', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetLocationsOverviewService.mockRejectedValue(new Error('db down'));

    const res = await request(app).get('/api/locations');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to retrieve locations' });
    errorSpy.mockRestore();
  });
});

describe('areas', () => {
  test('POST 201: creates an area from the body name', async () => {
    mockCreateAreaService.mockResolvedValue({ id: 2, name: 'Back Room' });

    const res = await request(app).post('/api/areas').send({ name: 'Back Room' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 2, name: 'Back Room' });
    expect(mockCreateAreaService).toHaveBeenCalledWith('Back Room');
  });

  test('POST 409: passes a duplicate-name error through', async () => {
    mockCreateAreaService.mockRejectedValue(httpError(409, 'An area named "Back Room" already exists'));

    const res = await request(app).post('/api/areas').send({ name: 'back room' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });

  test('PATCH 200: renames the area with the id from the URL', async () => {
    mockRenameAreaService.mockResolvedValue({ id: 1, name: 'Shop' });

    const res = await request(app).patch('/api/areas/1').send({ name: 'Shop' });

    expect(res.status).toBe(200);
    expect(mockRenameAreaService).toHaveBeenCalledWith('1', 'Shop');
  });

  test('DELETE 404: unknown area', async () => {
    mockDeleteAreaService.mockRejectedValue(httpError(404, 'Area not found'));

    const res = await request(app).delete('/api/areas/99');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Area not found' });
  });
});

describe('locations', () => {
  test('POST 201: creates a location in an area', async () => {
    mockCreateLocationService.mockResolvedValue({ id: 3, name: 'Bin 4', areaId: 1, itemCount: 0 });

    const res = await request(app).post('/api/locations').send({ name: 'Bin 4', areaId: 1 });

    expect(res.status).toBe(201);
    expect(mockCreateLocationService).toHaveBeenCalledWith({ name: 'Bin 4', areaId: 1 });
  });

  test('PATCH 200: moves a location to another area', async () => {
    mockUpdateLocationService.mockResolvedValue({ id: 2, name: 'Loose Shelf', areaId: 1, itemCount: 0 });

    const res = await request(app).patch('/api/locations/2').send({ areaId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe(1);
    expect(mockUpdateLocationService).toHaveBeenCalledWith('2', { name: undefined, areaId: 1 });
  });

  test('PATCH 200: areaId null unassigns a location', async () => {
    mockUpdateLocationService.mockResolvedValue({ id: 1, name: 'Tool Cabinet A', areaId: null, itemCount: 2 });

    const res = await request(app).patch('/api/locations/1').send({ areaId: null });

    expect(res.status).toBe(200);
    expect(mockUpdateLocationService).toHaveBeenCalledWith('1', { name: undefined, areaId: null });
  });

  test('DELETE 409: refuses to delete a location that still has items', async () => {
    mockDeleteLocationService.mockRejectedValue(httpError(409, '"Tool Cabinet A" still has 2 item(s).'));

    const res = await request(app).delete('/api/locations/1');

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/still has 2 item/);
  });
});
