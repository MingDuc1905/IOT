import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { DataPoller } from '../services/poller.js';
import { simulator } from '../services/simulator.js';
import { createIncidentService } from '../services/incidentService.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('End-to-End Simulation & Verification (Phase 4)', () => {
  let db;
  let poller;
  let incidentService;

  beforeEach(() => {
    db = new Database(':memory:');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    db.exec(schemaSql);
    db.prepare(`
      INSERT INTO nodes (node_id, label, esp_url) VALUES ('NODE-01', 'PoC Node', 'http://127.0.0.1:9999')
    `).run();

    poller = new DataPoller(db);
    incidentService = createIncidentService(db);
  });

  afterEach(() => {
    poller.stop();
    simulator.stop();
    db.close();
  });

  it('kịch bản mở vòi nước sinh hoạt (tapUsage) KHÔNG ĐƯỢC sinh vé sự cố nào', async () => {
    const startT = Date.now();
    simulator.start('tapUsage', startT);
    let time = startT;

    // Chạy giả lập 25 chu kỳ lấy mẫu (mỗi chu kỳ 500ms)
    for (let i = 0; i < 25; i++) {
      time += 500;
      await poller.tick(time);
    }

    const incidents = incidentService.listIncidents();
    expect(incidents).toHaveLength(0); // Tuyệt đối không sinh vé sự cố

    simulator.stop();
  });

  it('kịch bản bục vỡ ống (pipeBurst) PHẢI sinh đúng 1 ticket RAPID_DROP', async () => {
    const startT = Date.now();
    simulator.start('pipeBurst', startT);
    let time = startT;

    // Chạy giả lập qua pha giảm áp nhanh (ramp 1.0s)
    for (let i = 0; i < 25; i++) {
      time += 500;
      await poller.tick(time);
    }

    const incidents = incidentService.listIncidents();
    expect(incidents.length).toBeGreaterThanOrEqual(1);

    const rapidDropTicket = incidents.find((t) => t.alert_type === 'RAPID_DROP');
    expect(rapidDropTicket).toBeDefined();
    expect(rapidDropTicket.status).toBe('PENDING');
    expect(rapidDropTicket.trigger_pressure).toBeLessThan(0.20);

    simulator.stop();
  });
});
