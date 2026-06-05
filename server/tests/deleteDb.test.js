import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockGetDb = jest.fn().mockReturnValue({ query: mockQuery });

await jest.unstable_mockModule('../db/db.js', () => ({
  getDb: mockGetDb,
}));

const { deleteDb } = await import('../db/deleteDb.js');

afterEach(() => {
  jest.clearAllMocks();
});

test('deleteDb clears the Supabase inventory table', async () => {
  mockQuery.mockResolvedValue({ rowCount: 5 });

  await expect(deleteDb()).resolves.toBeUndefined();
  expect(mockGetDb).toHaveBeenCalled();
  expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/DELETE FROM inventory/i));
});

test('deleteDb throws when the query fails', async () => {
  mockQuery.mockRejectedValue(new Error('connection error'));

  await expect(deleteDb()).rejects.toThrow('connection error');
});
