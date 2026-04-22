import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: 'db/frc-inventory.db',
      driver: sqlite3.Database
    });
  }
  return db;
}