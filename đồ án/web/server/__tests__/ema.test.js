import { describe, it, expect } from 'vitest';
import { emaStep, createEma } from '../core/ema.js';

describe('EMA Filter (Exponential Moving Average)', () => {
  it('trả về đúng giá trị raw ở lần đo đầu tiên khi prev là null hoặc undefined', () => {
    expect(emaStep(null, 0.25, 0.25)).toBe(0.25);
    expect(emaStep(undefined, 0.30, 0.25)).toBe(0.30);
  });

  it('tính chính xác giá trị bước nhảy từ 0 lên 0.40 Bar với alpha = 0.25', () => {
    // pFiltered = 0.25 * 0.40 + 0.75 * 0 = 0.10
    const filtered = emaStep(0, 0.40, 0.25);
    expect(filtered).toBeCloseTo(0.10, 5);
  });

  it('hội tụ về giá trị hằng số 0.20 Bar sau chuỗi mẫu ổn định', () => {
    let val = 0.0;
    for (let i = 0; i < 30; i++) {
      val = emaStep(val, 0.20, 0.25);
    }
    expect(val).toBeCloseTo(0.20, 3);
  });

  it('quăng lỗi nếu alpha không nằm trong khoảng (0, 1]', () => {
    expect(() => emaStep(0.2, 0.3, 0)).toThrow();
    expect(() => emaStep(0.2, 0.3, -0.1)).toThrow();
    expect(() => emaStep(0.2, 0.3, 1.5)).toThrow();
  });

  it('closure createEma hoạt động đúng trạng thái push và reset', () => {
    const ema = createEma(0.25);
    expect(ema.current()).toBeNull();

    expect(ema.push(0.40)).toBe(0.40);
    expect(ema.current()).toBe(0.40);

    const step2 = ema.push(0.40);
    expect(step2).toBeCloseTo(0.40, 5);

    ema.reset();
    expect(ema.current()).toBeNull();
    expect(ema.push(0.20)).toBe(0.20);
  });
});
