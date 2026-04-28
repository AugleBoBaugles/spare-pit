// tests/inventory.test.js
import { jest } from '@jest/globals';

const mockGetAllInventoryService = jest.fn();

await jest.unstable_mockModule('../services/inventoryService.js', () => ({
  getAllInventoryService: mockGetAllInventoryService,
}));

// Dynamic imports MUST come after unstable_mockModule
const { default: app } = await import('../app.js');

const mockInventory = [
  { id: 1, name: 'Cordless Drill', type: 'tool', location: 'Tool Cabinet A', status: 'available' },
  { id: 2, name: 'Multimeter', type: 'tool', location: 'Electronics Bench', status: 'in-use' },
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