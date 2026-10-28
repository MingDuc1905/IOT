import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.js';

let defaultDb = null;

export function createDatabaseConnection(dbFilePath = CONFIG.DB_PATH) {
  if (dbFilePath !== ':memory:') {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function getDb() {
  if (!defaultDb) {
    defaultDb = createDatabaseConnection();
  }
  return defaultDb;
}

export function closeDb() {
  if (defaultDb) {
    defaultDb.close();
    defaultDb = null;
  }
}
