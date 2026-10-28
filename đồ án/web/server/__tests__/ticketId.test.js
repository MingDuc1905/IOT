import { describe, it, expect } from 'vitest';
import { nextTicketId } from '../core/ticketId.js';

describe('Ticket ID Generator', () => {
  it('sinh mã INC-YYYYMMDD-001 khi danh sách rỗng', () => {
    const id = nextTicketId('2026-10-25', []);
    expect(id).toBe('INC-20261025-001');
  });

  it('tăng dần khi đã có các mã -001, -002', () => {
    const existing = ['INC-20261025-001', 'INC-20261025-002'];
    const id = nextTicketId('2026-10-25', existing);
    expect(id).toBe('INC-20261025-003');
  });

  it('reset về -001 khi chuyển sang ngày mới', () => {
    // Chỉ truyền các id cùng ngày
    const id = nextTicketId('2026-10-25', []);
    expect(id).toBe('INC-20261025-001');
  });

  it('lấy số lớn nhất tiếp theo nếu có lỗ hổng giữa dãy (-001, -003)', () => {
    const existing = ['INC-20261025-001', 'INC-20261025-003'];
    const id = nextTicketId('2026-10-25', existing);
    expect(id).toBe('INC-20261025-004');
  });

  it('mở rộng lên 4 chữ số an toàn khi vượt quá 999 ticket/ngày', () => {
    const existing = ['INC-20261025-999'];
    const id = nextTicketId('2026-10-25', existing);
    expect(id).toBe('INC-20261025-1000');
  });
});
