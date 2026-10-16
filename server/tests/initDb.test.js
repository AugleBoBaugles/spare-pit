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

test('initDb creates the inventory table when it is missing', async () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  mockQuery
    .mockRejectedValueOnce(new Error('relation "inventory" does not exist'))
    .mockResolvedValue({ rows: [] });

  await expect(initDb()).resolves.toBeDefined();
  expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/create table if not exists public\.inventory/i));

  logSpy.mockRestore();
});

test('initDb throws a descriptive error when the table is unavailable and cannot be created', async () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockQuery.mockRejectedValue(new Error('permission denied for schema public'));

  await expect(initDb()).rejects.toThrow(/Postgres inventory table is unavailable/i);

  logSpy.mockRestore();
  errorSpy.mockRestore();
});
