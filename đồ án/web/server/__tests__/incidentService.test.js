import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIncidentService } from '../services/incidentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Incident Service (Quản lý vòng đời sự cố)', () => {
  let db;
  let service;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    db.exec(schemaSql);

    db.prepare(`
      INSERT INTO nodes (node_id, label, esp_url) VALUES ('NODE-01', 'Test Node', 'http://localhost')
    `).run();

    service = createIncidentService(db);
  });

  it('RAPID_DROP kéo dài 5 chu kỳ chỉ sinh ĐÚNG 1 ticket sự cố', () => {
    const sample = {
      node_id: 'NODE-01',
      pressure: 0.12,
      dp_dt: -0.10,
      timestamp: '2026-10-25T00:00:00.000Z',
    };

    for (let i = 0; i < 5; i++) {
      service.handleSample(sample, 'RAPID_DROP');
    }

    const tickets = service.listIncidents();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].alert_type).toBe('RAPID_DROP');
    expect(tickets[0].status).toBe('PENDING');
  });

  it('sinh ticket MỚI khi sự cố trước đó cùng loại đã được RESOLVED', () => {
    const sample1 = {
      node_id: 'NODE-01',
      pressure: 0.12,
      dp_dt: -0.10,
      timestamp: '2026-10-25T00:00:00.000Z',
    };
    service.handleSample(sample1, 'RAPID_DROP');

    const [t1] = service.listIncidents();
    // Giải quyết ticket cũ
    service.updateIncident(t1.ticket_id, {
      status: 'RESOLVED',
      staff_name: 'Nguyễn Văn Kỹ Thuật',
      action_taken: 'Đã siết lại đầu ống nối xi-lanh',
    });

    // Sự cố thứ 2 xảy ra sau đó
    const sample2 = {
      node_id: 'NODE-01',
      pressure: 0.10,
      dp_dt: -0.12,
      timestamp: '2026-10-25T00:05:00.000Z',
    };
    service.handleSample(sample2, 'RAPID_DROP');

    const tickets = service.listIncidents();
    expect(tickets).toHaveLength(2);
    expect(tickets.some((t) => t.status === 'RESOLVED')).toBe(true);
    expect(tickets.some((t) => t.status === 'PENDING')).toBe(true);
  });

  it('không sinh thêm ticket nếu sự cố cùng loại đang PENDING hoặc INVESTIGATING', () => {
    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.38,
      dp_dt: 0.01,
      timestamp: '2026-10-25T00:00:00.000Z',
    }, 'HIGH_PRESSURE');

    const [t1] = service.listIncidents();
    service.updateIncident(t1.ticket_id, { status: 'INVESTIGATING', staff_name: 'Trần Văn A' });

    // Tiếp tục đo được HIGH_PRESSURE
    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.39,
      dp_dt: 0.00,
      timestamp: '2026-10-25T00:00:01.000Z',
    }, 'HIGH_PRESSURE');

    const tickets = service.listIncidents();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].status).toBe('INVESTIGATING');
  });

  it('chặn cập nhật RESOLVED nếu thiếu action_taken', () => {
    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.02,
      dp_dt: -0.01,
      timestamp: '2026-10-25T00:00:00.000Z',
    }, 'LOW_PRESSURE');

    const [t1] = service.listIncidents();
    expect(() => {
      service.updateIncident(t1.ticket_id, {
        status: 'RESOLVED',
        staff_name: 'Trần Văn A',
        action_taken: '', // Rỗng
      });
    }).toThrow();
  });

  it('tự động điền resolved_at khi cập nhật sang RESOLVED', () => {
    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.02,
      dp_dt: -0.01,
      timestamp: '2026-10-25T00:00:00.000Z',
    }, 'LOW_PRESSURE');

    const [t1] = service.listIncidents();
    const updated = service.updateIncident(t1.ticket_id, {
      status: 'RESOLVED',
      staff_name: 'Trần Văn A',
      action_taken: 'Đã bơm cấp nước bổ sung',
    });

    expect(updated.status).toBe('RESOLVED');
    expect(updated.resolved_at).toBeTruthy();
  });

  it('xử lý 2 sự cố alert_type khác nhau cùng lúc thành 2 ticket độc lập', () => {
    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.38,
      dp_dt: 0.01,
      timestamp: '2026-10-25T00:00:00.000Z',
    }, 'HIGH_PRESSURE');

    service.handleSample({
      node_id: 'NODE-01',
      pressure: 0.15,
      dp_dt: -0.12,
      timestamp: '2026-10-25T00:00:01.000Z',
    }, 'RAPID_DROP');

    const tickets = service.listIncidents();
    expect(tickets).toHaveLength(2);
    const types = tickets.map((t) => t.alert_type).sort();
    expect(types).toEqual(['HIGH', 'RAPID_DROP']);
  });
});
