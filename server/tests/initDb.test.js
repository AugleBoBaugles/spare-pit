import fs from 'fs';
import { initDb } from '../db/initDb';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const TEST_DB = './db/test.db';

afterEach(async () => {
  // give SQLite a moment to release file handle (Windows fix)
  await new Promise(r => setTimeout(r, 50));

  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
});

test('creates database file', async () => {
    const db = await initDb(TEST_DB);
    
    expect(fs.existsSync(TEST_DB)).toBe(true);

    await db.close();
})

test('creates inventory table', async () => {
  const db =await initDb(TEST_DB);

  const table = await db.get(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='inventory'
  `);

  expect(table).toBeDefined();

  await db.close();
});

test('initDb is idempotent (safe to run multiple times)', async () => {
    const db1 = await initDb(TEST_DB);
    await db1.close();

    const db2 = await initDb(TEST_DB);
    await db2.close();

    // reopen to verify schema is still correct
    const db = await open({
        filename: TEST_DB,
        driver: sqlite3.Database
    });

    const table = await db.get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='inventory'
    `);

    expect(table).toBeDefined();

    await db.close();
});

test('inventory table has correct columns', async () => {
  const db = await initDb(TEST_DB);

  const columns = await db.all(`PRAGMA table_info(inventory)`);
  const columnNames = columns.map(col => col.name);

  expect(columnNames).toEqual(expect.arrayContaining([
    'id', 'name', 'type', 'area', 'location',
    'status', 'quantity', 'condition', 'itemImage',
    'checkOutBy', 'lastUpdated', 'tags', 'notes'
  ]));

  await db.close();
});
