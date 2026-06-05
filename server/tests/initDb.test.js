import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockGetDb = jest.fn().mockReturnValue({ query: mockQuery });

await jest.unstable_mockModule('../db/db.js', () => ({
  getDb: mockGetDb,
}));

const { initDb } = await import('../db/initDb.js');

afterEach(() => {
  jest.clearAllMocks();
});

test('initDb verifies inventory table access', async () => {
  mockQuery.mockResolvedValue({ rows: [] });

  await expect(initDb()).resolves.toBeDefined();
  expect(mockGetDb).toHaveBeenCalled();
  expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/FROM inventory/i));
});

test('initDb throws a descriptive error when the table is unavailable', async () => {
  mockQuery.mockRejectedValue(new Error('relation "inventory" does not exist'));

  await expect(initDb()).rejects.toThrow(/Supabase inventory table is unavailable/i);
});
