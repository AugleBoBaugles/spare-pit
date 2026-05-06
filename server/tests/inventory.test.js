// tests/inventory.test.js
import { jest } from '@jest/globals';

const mockGetAllInventoryService = jest.fn();

await jest.unstable_mockModule('../services/inventoryService.js', () => ({
  getAllInventoryService: mockGetAllInventoryService,
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