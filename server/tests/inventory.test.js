// tests/inventory.test.js
import { jest } from '@jest/globals';

const mockGetAllInventoryService = jest.fn();
const mockPostInventoryService = jest.fn();
const mockDeleteInventoryService = jest.fn();

await jest.unstable_mockModule('../services/inventoryService.js', () => ({
  getAllInventoryService: mockGetAllInventoryService,
  postInventoryService: mockPostInventoryService,
  deleteInventoryService: mockDeleteInventoryService,
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
    checkOutBy: 'Jamie R.', lastUpdated: '2025-04-10 14:30:00',
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
