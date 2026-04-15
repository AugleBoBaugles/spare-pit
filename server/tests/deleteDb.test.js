import fs from 'fs';
import { deleteDb } from '../db/deleteDb.js';

const TEST_DB = './db/test.db';

afterEach(() => {
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
});

test('deletes existing database file', () => {
  fs.writeFileSync(TEST_DB, 'fake db');

  expect(fs.existsSync(TEST_DB)).toBe(true);

  deleteDb(TEST_DB);

  expect(fs.existsSync(TEST_DB)).toBe(false);
});

test('does nothing if database does not exist', () => {
  expect(fs.existsSync(TEST_DB)).toBe(false);

  deleteDb(TEST_DB);

  expect(fs.existsSync(TEST_DB)).toBe(false);
});