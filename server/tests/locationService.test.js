// tests/locationService.test.js — area/location rules, with the model layer mocked.
import { jest } from '@jest/globals';

const model = {
  getAllAreas: jest.fn(),
  findAreaById: jest.fn(),
  findAreaByName: jest.fn(),
  insertArea: jest.fn(),
  renameArea: jest.fn(),
  findUnassignClashes: jest.fn(),
  deleteAreaById: jest.fn(),
  getAllLocations: jest.fn(),
  findLocationById: jest.fn(),
  findLocationByName: jest.fn(),
  insertLocation: jest.fn(),
  updateLocation: jest.fn(),
  deleteLocationById: jest.fn(),
};

await jest.unstable_mockModule('../models/locationModel.js', () => model);

const {
  createAreaService,
  deleteAreaService,
  createLocationService,
  updateLocationService,
  deleteLocationService,
  checkLocationId,
  ensureLocation,
} = await import('../services/locationService.js');

const shop = { id: 1, name: 'Machine Shop' };
const backRoom = { id: 2, name: 'Back Room' };
const cabinet = { id: 10, name: 'Tool Cabinet A', areaId: 1, itemCount: 2 };

beforeEach(() => {
  jest.resetAllMocks();
  model.findAreaById.mockImplementation(async (id) => [shop, backRoom].find(a => a.id === Number(id)) ?? null);
});

describe('areas', () => {
  test('rejects a blank area name', async () => {
    await expect(createAreaService('   ')).rejects.toMatchObject({ status: 400 });
  });

  test('rejects a duplicate area name', async () => {
    model.findAreaByName.mockResolvedValue(shop);
    await expect(createAreaService('machine shop')).rejects.toMatchObject({ status: 409 });
    expect(model.insertArea).not.toHaveBeenCalled();
  });

  test('deleting an area is refused when its locations would clash with unassigned ones', async () => {
    model.findUnassignClashes.mockResolvedValue(['Tool Cabinet A']);
    await expect(deleteAreaService(1)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('"Tool Cabinet A"'),
    });
    expect(model.deleteAreaById).not.toHaveBeenCalled();
  });

  test('deleting an area with no clashes deletes it', async () => {
    model.findUnassignClashes.mockResolvedValue([]);
    await expect(deleteAreaService(1)).resolves.toEqual(shop);
    expect(model.deleteAreaById).toHaveBeenCalledWith(1);
  });
});

describe('locations', () => {
  test('allows the same name in a different area', async () => {
    model.findLocationByName.mockResolvedValue(null);
    model.insertLocation.mockResolvedValue({ id: 11, name: 'Tool Cabinet A', areaId: 2, itemCount: 0 });

    await createLocationService({ name: ' Tool Cabinet A ', areaId: 2 });

    expect(model.findLocationByName).toHaveBeenCalledWith('Tool Cabinet A', 2);
    expect(model.insertLocation).toHaveBeenCalledWith('Tool Cabinet A', 2);
  });

  test('rejects a duplicate name within the same area, naming the area', async () => {
    model.findLocationByName.mockResolvedValue(cabinet);
    await expect(createLocationService({ name: 'tool cabinet a', areaId: 1 }))
      .rejects.toMatchObject({ status: 409, message: 'Machine Shop already has a location named "tool cabinet a"' });
  });

  test('rejects an areaId that does not exist', async () => {
    await expect(createLocationService({ name: 'Bin', areaId: 99 })).rejects.toMatchObject({ status: 400 });
  });

  test('moving a location checks for a same-named location in the target area', async () => {
    model.findLocationById.mockResolvedValue(cabinet);
    model.findLocationByName.mockResolvedValue({ id: 11, name: 'Tool Cabinet A', areaId: 2, itemCount: 0 });

    await expect(updateLocationService(10, { areaId: 2 }))
      .rejects.toMatchObject({ status: 409, message: expect.stringContaining('Back Room') });
    expect(model.findLocationByName).toHaveBeenCalledWith('Tool Cabinet A', 2);
    expect(model.updateLocation).not.toHaveBeenCalled();
  });

  test('renaming a location to its own name (different case) is allowed', async () => {
    model.findLocationById.mockResolvedValue(cabinet);
    model.findLocationByName.mockResolvedValue(cabinet);
    model.updateLocation.mockResolvedValue({ ...cabinet, name: 'TOOL CABINET A' });

    await updateLocationService(10, { name: 'TOOL CABINET A' });

    expect(model.updateLocation).toHaveBeenCalledWith(10, { name: 'TOOL CABINET A' });
  });

  test('moving a location to unassigned (areaId null) checks the unassigned group', async () => {
    model.findLocationById.mockResolvedValue(cabinet);
    model.findLocationByName.mockResolvedValue(null);

    await updateLocationService(10, { areaId: null });

    expect(model.findLocationByName).toHaveBeenCalledWith('Tool Cabinet A', null);
    expect(model.updateLocation).toHaveBeenCalledWith(10, { areaId: null });
  });

  test('refuses to delete a location that still has items', async () => {
    model.findLocationById.mockResolvedValue(cabinet);
    await expect(deleteLocationService(10)).rejects.toMatchObject({ status: 409 });
    expect(model.deleteLocationById).not.toHaveBeenCalled();
  });
});

describe('checkLocationId', () => {
  test('accepts null (no location)', async () => {
    await expect(checkLocationId(null)).resolves.toBeUndefined();
  });

  test('rejects an id that does not exist', async () => {
    model.findLocationById.mockResolvedValue(null);
    await expect(checkLocationId(42)).rejects.toMatchObject({ status: 400 });
  });

  test('rejects a non-integer id', async () => {
    await expect(checkLocationId('5')).rejects.toMatchObject({ status: 400 });
  });
});

describe('ensureLocation (seed helper)', () => {
  test('creates the area and the location when neither exists, and returns the location id', async () => {
    model.findAreaByName.mockResolvedValue(null);
    model.insertArea.mockResolvedValue({ id: 3, name: 'Lab' });
    model.findLocationByName.mockResolvedValue(null);
    model.insertLocation.mockResolvedValue({ id: 20, name: 'Bench', areaId: 3, itemCount: 0 });

    await expect(ensureLocation('Bench', 'Lab')).resolves.toBe(20);
    expect(model.insertLocation).toHaveBeenCalledWith('Bench', 3);
  });
});
