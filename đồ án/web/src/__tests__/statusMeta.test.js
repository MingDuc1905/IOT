import { describe, it, expect } from 'vitest';
import { ALERT_META, STATUS_META, TICKET_META, metaOf } from '../features/incidents/statusMeta.js';

describe('statusMeta (Ánh xạ nhãn và token giao diện Tabler)', () => {
  it('mọi giá trị alert_type đều có nhãn tiếng Việt và class Tabler -lt hợp lệ', () => {
    for (const key of ['HIGH', 'LOW', 'RAPID_DROP']) {
      const meta = metaOf(ALERT_META, key);
      expect(meta.label).toBeTruthy();
      expect(meta.badge).toMatch(/^bg-[a-z]+-lt$/);
      expect(meta.badge).not.toContain('subtle');
    }
  });

  it('mọi giá trị firmware status đều có nhãn tiếng Việt và class Tabler -lt hợp lệ', () => {
    for (const key of ['NORMAL', 'HIGH_PRESSURE', 'LOW_PRESSURE', 'RAPID_DROP', 'SENSOR_FAULT']) {
      const meta = metaOf(STATUS_META, key);
      expect(meta.label).toBeTruthy();
      expect(meta.badge).toMatch(/^bg-[a-z]+-lt$/);
      expect(meta.badge).not.toContain('subtle');
    }
    expect(metaOf(STATUS_META, 'SENSOR_FAULT').label).toBe('Lỗi cảm biến');
  });

  it('mọi trạng thái vòng đời ticket đều có nhãn chuẩn', () => {
    for (const key of ['PENDING', 'INVESTIGATING', 'RESOLVED']) {
      const meta = metaOf(TICKET_META, key);
      expect(meta.label).toBeTruthy();
      expect(meta.badge).toMatch(/^bg-[a-z]+-lt$/);
    }
  });

  it('trả về fallback an toàn khi gặp key không xác định hoặc null', () => {
    const metaUnknown = metaOf(STATUS_META, 'UNKNOWN_STATUS');
    expect(metaUnknown.label).toBe('Không xác định');
    expect(metaUnknown.badge).toBe('bg-secondary-lt');

    const metaNull = metaOf(STATUS_META, null);
    expect(metaNull.label).toBe('Không xác định');
  });
});
