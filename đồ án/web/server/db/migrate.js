import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../config.js';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function migrate(database = getDb()) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Thực thi DDL schema
  database.exec(schemaSql);

  // Seed node mẫu duy nhất (PoC Node) nếu chưa có
  const seedNode = database.prepare(`
    INSERT INTO nodes (node_id, label, location, esp_url)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(node_id) DO UPDATE SET
      label = excluded.label,
      location = excluded.location,
      esp_url = excluded.esp_url
  `);

  seedNode.run(
    'NODE-01',
    'Trạm đo đầu tuyến (PoC Node)',
    'Khu vực van cấp chính',
    CONFIG.ESP_URL
  );

  return true;
}

// Chạy trực tiếp qua dòng lệnh: node server/db/migrate.js
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  try {
    const db = getDb();
    migrate(db);
    console.log('✅ Khởi tạo và đồng bộ Database SQLite thành công:', CONFIG.DB_PATH);
    const nodes = db.prepare('SELECT * FROM nodes').all();
    console.log('📋 Danh sách nodes hiện có:', nodes);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo SQLite:', err);
    process.exit(1);
  }
}
