// tests/inventory.test.js
import { jest } from '@jest/globals';

const mockGetAllInventoryService = jest.fn();
const mockPostInventoryService = jest.fn();
const mockDeleteInventoryService = jest.fn();
const mockPatchInventoryService = jest.fn();
const mockPatchableColumns = [
  'name', 'type', 'area', 'location', 'status',
  'quantity', 'condition', 'itemImage', 'checkOutBy', 'tags', 'notes',
  'needsRestock'
];
const mockGetSubteamsService = jest.fn();
const mockGetTagsService = jest.fn();

await jest.unstable_mockModule('../services/inventoryService.js', () => ({
  getAllInventoryService: mockGetAllInventoryService,
  postInventoryService: mockPostInventoryService,
  deleteInventoryService: mockDeleteInventoryService,
  patchInventoryService: mockPatchInventoryService,
  patchableColumns: mockPatchableColumns,
  getSubteamsService: mockGetSubteamsService,
  getTagsService: mockGetTagsService,
}));

// Dynamic imports MUST come after unstable_mockModule
const { default: app } = await import('../app.js');

const mockInventory = [
  {
    id: 1, name: 'Cordless Drill', type: 'tool', area: 'Machine Shop',
    location: 'Tool Cabinet A', status: 'available', quantity: 2,
    condition: 'good', itemImage: 'images/cordless-drill.jpg',
    checkOutBy: null, lastUpdated: '2025-04-01 10:00:00',
    tags: 'power,drilling', notes: 'Includes 2 battery packs'
  },
  {
    id: 2, name: 'Multimeter', type: 'tool', area: 'Electronics Lab',
    location: 'Electronics Bench 2', status: 'checked-out', quantity: 2,
    condition: 'fair', itemImage: 'images/multimeter.jpg',
    checkOutBy: 'electrical', lastUpdated: '2025-04-10 14:30:00',
    tags: 'electronics,testing', notes: 'One unit has a cracked screen but works fine'
  },
];

const validPostBody = {
  name: 'Soldering Iron',
  type: 'tool',
  area: 'Electronics Lab',
  location: 'Electronics Bench 1',
  status: 'available',
  quantity: 3,
  condition: 'good',
  itemImage: 'images/soldering-iron.jpg',
  checkOutBy: null,
  tags: 'electronics,soldering',
  notes: 'Set temp to 350°C for standard use',
};

const mockNewItem = { id: 3, ...validPostBody, lastUpdated: 1714500000000 };

// ─── GET /api/inventory/subteams ─────────────────────────────────────────────

describe('GET /api/inventory/subteams', () => {
  afterEach(() => jest.resetAllMocks());

  test('200: returns array of subteam strings', async () => {
    mockGetSubteamsService.mockResolvedValue(['electrical', 'mechanical', 'programming']);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/subteams');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['electrical', 'mechanical', 'programming']);
  });

  test('200: returns empty array when no items have a checkOutBy value', async () => {
    mockGetSubteamsService.mockResolvedValue([]);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/subteams');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('500: returns error json when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSubteamsService.mockRejectedValue(new Error('DB connection failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/subteams');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to retrieve subteams' });
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching subteams:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

// ─── GET /api/inventory/tags ─────────────────────────────────────────────────

describe('GET /api/inventory/tags', () => {
  afterEach(() => jest.resetAllMocks());

  test('200: returns empty array when no items have tags', async () => {
    mockGetTagsService.mockResolvedValue([]);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/tags');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200: returns sorted deduplicated tags for a single item', async () => {
    // Service returns already-parsed result; we just verify the route passes it through.
    mockGetTagsService.mockResolvedValue(['battery', 'motor']);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/tags');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['battery', 'motor']);
  });

  test('200: deduplicates overlapping tags from multiple items', async () => {
    // Both items share "motor"; the service deduplicates and sorts before returning.
    mockGetTagsService.mockResolvedValue(['battery', 'motor', 'power']);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/tags');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['battery', 'motor', 'power']);
  });

  test('500: returns error json when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetTagsService.mockRejectedValue(new Error('DB connection failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory/tags');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to retrieve tags' });
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching tags:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

// ─── GET /api/inventory ───────────────────────────────────────────────────────

describe('GET /api/inventory', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('GET / returns welcome message', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toBe('Welcome to the Spare Pit API!');
  });

  test('200: returns inventory array on success', async () => {
    mockGetAllInventoryService.mockResolvedValue(mockInventory);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockInventory);
  });

  test('200: returns items with all expected fields', async () => {
    mockGetAllInventoryService.mockResolvedValue(mockInventory);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory');

    expect(res.status).toBe(200);

    const item = res.body[0];
    expect(item).toHaveProperty('area');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('condition');
    expect(item).toHaveProperty('itemImage');
    expect(item).toHaveProperty('checkOutBy');
    expect(item).toHaveProperty('lastUpdated');
    expect(item).toHaveProperty('tags');
    expect(item).toHaveProperty('notes');
  });

  test('200: returns empty array when inventory is empty', async () => {
    mockGetAllInventoryService.mockResolvedValue([]);

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('500: returns error json when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetAllInventoryService.mockRejectedValue(new Error('DB connection failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).get('/api/inventory');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to retrieve inventory items' });
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching inventory:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

// ─── POST /api/inventory ──────────────────────────────────────────────────────

describe('POST /api/inventory', () => {
  afterEach(() => jest.resetAllMocks());

  test('201: returns new item with possibleDuplicate: null on success', async () => {
    mockPostInventoryService.mockResolvedValue({ ...mockNewItem, possibleDuplicate: null });

    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send(validPostBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), name: 'Soldering Iron' });
    expect(res.body.possibleDuplicate).toBeNull();
  });

  test('201: returns new item with possibleDuplicate populated when name already exists', async () => {
    const duplicate = { ...mockNewItem, id: 1 };
    mockPostInventoryService.mockResolvedValue({ ...mockNewItem, possibleDuplicate: duplicate });

    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send(validPostBody);

    expect(res.status).toBe(201);
    expect(res.body.possibleDuplicate).not.toBeNull();
    expect(res.body.possibleDuplicate).toMatchObject({ name: 'Soldering Iron' });
  });

  test('201: succeeds with only name provided', async () => {
    const minimalItem = { id: 4, name: 'mystery part', type: null, area: null,
      location: null, status: null, quantity: null, condition: null,
      itemImage: null, checkOutBy: null, lastUpdated: 1714500000000,
      tags: null, notes: null, possibleDuplicate: null };
    mockPostInventoryService.mockResolvedValue(minimalItem);

    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send({ name: 'mystery part' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('mystery part');
  });

  test('201: strips unknown fields from request body before posting', async () => {
    mockPostInventoryService.mockResolvedValue({ ...mockNewItem, possibleDuplicate: null });

    const { default: request } = await import('supertest');
    await request(app).post('/api/inventory').send({ ...validPostBody, injectedField: 'malicious' });

    const calledWith = mockPostInventoryService.mock.calls[0][0];
    expect(calledWith).not.toHaveProperty('injectedField');
  });

  test('400: missing name returns descriptive error', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send({ type: 'tool' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  test('400: empty string name returns descriptive error', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  test('400: non-integer quantity returns descriptive error', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send({ ...validPostBody, quantity: 'five' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity must be a non-negative integer/i);
  });

  test('400: negative quantity returns descriptive error', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send({ ...validPostBody, quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity must be a non-negative integer/i);
  });

  test('500: returns error json when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPostInventoryService.mockRejectedValue(new Error('DB insert failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).post('/api/inventory').send(validPostBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to add inventory item' });
    expect(consoleSpy).toHaveBeenCalledWith('Error posting tool:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

// ─── DELETE /api/inventory/:id ────────────────────────────────────────────────

describe('DELETE /api/inventory/:id', () => {
  afterEach(() => jest.resetAllMocks());

  test('200: returns confirmation message and deleted item on success', async () => {
    mockDeleteInventoryService.mockResolvedValue(mockInventory[0]);

    const { default: request } = await import('supertest');
    const res = await request(app).delete('/api/inventory/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Cordless Drill/i);
    expect(res.body.deleted).toMatchObject({ id: 1, name: 'Cordless Drill' });
  });

  test('200: deleted field contains all expected inventory fields', async () => {
    mockDeleteInventoryService.mockResolvedValue(mockInventory[0]);

    const { default: request } = await import('supertest');
    const res = await request(app).delete('/api/inventory/1');

    expect(res.status).toBe(200);
    expect(res.body.deleted).toHaveProperty('id');
    expect(res.body.deleted).toHaveProperty('name');
    expect(res.body.deleted).toHaveProperty('type');
    expect(res.body.deleted).toHaveProperty('status');
    expect(res.body.deleted).toHaveProperty('quantity');
  });

  test('404: returns descriptive error when id does not exist in db', async () => {
    mockDeleteInventoryService.mockRejectedValue(
      Object.assign(new Error('Inventory item not found'), { statusCode: 404 })
    );

    const { default: request } = await import('supertest');
    const res = await request(app).delete('/api/inventory/9999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/inventory item not found/i);
  });

  test('500: returns error json when service throws unexpectedly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteInventoryService.mockRejectedValue(new Error('DB connection failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).delete('/api/inventory/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete inventory item' });
    expect(consoleSpy).toHaveBeenCalledWith('Error deleting inventory item:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  test('500: service is called with the correct id from route params', async () => {
    mockDeleteInventoryService.mockResolvedValue(mockInventory[1]);

    const { default: request } = await import('supertest');
    await request(app).delete('/api/inventory/2');

    expect(mockDeleteInventoryService).toHaveBeenCalledWith('2');
    expect(mockDeleteInventoryService).toHaveBeenCalledTimes(1);
  });
});

// ─── PATCH /api/inventory/:id ─────────────────────────────────────────────────

describe('PATCH /api/inventory/:id', () => {
  // Reset mocks after each test so call counts don't bleed between tests.
  afterEach(() => jest.resetAllMocks());

  // A realistic patch body matching what the frontend sends after a status change.
  const validPatchBody = { status: 'checked-out', checkOutBy: 'mechanical' };
  const updatedItem = { ...mockInventory[0], status: 'checked-out', checkOutBy: 'mechanical', lastUpdated: Date.now() };

  test('200: returns updated item on success', async () => {
    mockPatchInventoryService.mockResolvedValue(updatedItem);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send(validPatchBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, status: 'checked-out', checkOutBy: 'mechanical' });
  });

  // Runs the same test once per patchable field to confirm the controller passes
  // each one through to the service and echoes it back in the response.
  // `%s` in the test name is replaced with the field name by Jest.
  test.each([
    ['name',       'Updated Drill'],
    ['type',       'part'],
    ['area',       'New Area'],
    ['location',   'New Location'],
    ['status',     'missing'],
    ['quantity',   5],
    ['condition',  'fair'],
    ['itemImage',  'images/new.jpg'],
    ['checkOutBy', 'programming'],
    ['tags',       'new,tags'],
    ['notes',      'Updated notes'],
  ])('200: correctly patches %s field to service and returns it', async (field, value) => {
    const returnedItem = { ...mockInventory[0], [field]: value };
    mockPatchInventoryService.mockResolvedValue(returnedItem);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ [field]: value });

    expect(res.status).toBe(200);
    // Confirm the response body contains the new value for this field.
    expect(res.body[field]).toEqual(value);
    // Confirm the controller passed the field to the service (not swallowed it).
    // mock.calls[0] is the first call; [1] is the second argument (updates object).
    const [, updates] = mockPatchInventoryService.mock.calls[0];
    expect(updates).toHaveProperty(field, value);
  });

  // The controller should strip any fields not in `patchableColumns` to prevent
  // clients from writing arbitrary columns (e.g. `id` or `lastUpdated`).
  test('200: strips unknown fields and only passes patchable fields to service', async () => {
    mockPatchInventoryService.mockResolvedValue(updatedItem);

    const { default: request } = await import('supertest');
    await request(app).patch('/api/inventory/1').send({ ...validPatchBody, injectedField: 'malicious' });

    const [, updates] = mockPatchInventoryService.mock.calls[0];
    expect(updates).not.toHaveProperty('injectedField');
    expect(updates).not.toHaveProperty('id');
    expect(updates).not.toHaveProperty('lastUpdated');
  });

  // Sending a body with no recognised fields should be rejected, not silently ignored.
  test('400: returns error when body contains no valid patchable fields', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ injectedField: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one valid field/i);
  });

  test('400: returns error when quantity is a non-integer', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ quantity: 'five' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity must be a non-negative integer/i);
  });

  test('400: returns error when quantity is negative', async () => {
    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity must be a non-negative integer/i);
  });

  // The service throws a custom error with `status: 404` when the id isn't in the DB.
  // The controller reads `err.status` to forward the right HTTP status code.
  test('404: returns error when item does not exist', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const notFoundErr = Object.assign(new Error('Inventory item with ID 999 not found'), { status: 404 });
    mockPatchInventoryService.mockRejectedValue(notFoundErr);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/999').send(validPatchBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/inventory item with id 999 not found/i);

    consoleSpy.mockRestore();
  });

  test('500: returns error json when service throws a generic error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPatchInventoryService.mockRejectedValue(new Error('DB update failed'));

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send(validPatchBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB update failed');
    expect(consoleSpy).toHaveBeenCalledWith('Error patching inventory:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  // ── needsRestock toggle ────────────────────────────────────────────────────

  test('200: sets needsRestock to 1 (flag on)', async () => {
    const flaggedItem = { ...mockInventory[0], needsRestock: 1 };
    mockPatchInventoryService.mockResolvedValue(flaggedItem);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ needsRestock: 1 });

    expect(res.status).toBe(200);
    expect(res.body.needsRestock).toBe(1);
    const [, updates] = mockPatchInventoryService.mock.calls[0];
    expect(updates).toHaveProperty('needsRestock', 1);
  });

  test('200: sets needsRestock to 0 (flag off)', async () => {
    const unflaggedItem = { ...mockInventory[0], needsRestock: 0 };
    mockPatchInventoryService.mockResolvedValue(unflaggedItem);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ needsRestock: 0 });

    expect(res.status).toBe(200);
    expect(res.body.needsRestock).toBe(0);
    const [, updates] = mockPatchInventoryService.mock.calls[0];
    expect(updates).toHaveProperty('needsRestock', 0);
  });

  test('200: needsRestock flag is preserved when other fields are updated', async () => {
    // Simulates updating quantity while the item is already flagged.
    const itemWithFlag = { ...mockInventory[0], quantity: 5, needsRestock: 1 };
    mockPatchInventoryService.mockResolvedValue(itemWithFlag);

    const { default: request } = await import('supertest');
    const res = await request(app).patch('/api/inventory/1').send({ quantity: 5 });

    expect(res.status).toBe(200);
    // The flag value comes from the service/DB — the patch body only touched quantity.
    expect(res.body.needsRestock).toBe(1);
    const [, updates] = mockPatchInventoryService.mock.calls[0];
    // Only quantity was in the patch body, so needsRestock must NOT be in updates.
    expect(updates).not.toHaveProperty('needsRestock');
    expect(updates).toHaveProperty('quantity', 5);
  });
});
