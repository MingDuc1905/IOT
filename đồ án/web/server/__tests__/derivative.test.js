import { describe, it, expect } from 'vitest';
import { slopeBarPerSecond } from '../core/derivative.js';

describe('Derivative Calculation (dP/dt via Least Squares Regression)', () => {
  it('tính đúng độ dốc đường thẳng giảm 0.1 Bar trong 1000ms là -0.10 Bar/s', () => {
    const samples = [
      { t: 0, p: 0.30 },
      { t: 250, p: 0.275 },
      { t: 500, p: 0.25 },
      { t: 750, p: 0.225 },
      { t: 1000, p: 0.20 },
    ];
    const slope = slopeBarPerSecond(samples);
    expect(slope).toBeCloseTo(-0.10, 4);
  });

  it('trả về 0 khi có ít hơn 3 mẫu', () => {
    expect(slopeBarPerSecond([])).toBe(0);
    expect(slopeBarPerSecond([{ t: 0, p: 0.2 }])).toBe(0);
    expect(slopeBarPerSecond([{ t: 0, p: 0.2 }, { t: 100, p: 0.19 }])).toBe(0);
  });

  it('trả về 0 khi tổng khoảng thời gian Δt nhỏ hơn 200ms (chưa đủ cửa sổ)', () => {
    const samples = [
      { t: 0, p: 0.20 },
      { t: 50, p: 0.19 },
      { t: 100, p: 0.18 },
    ];
    expect(slopeBarPerSecond(samples)).toBe(0);
  });

  it('khử nhiễu tốt trên chuỗi áp suất phẳng có dao động ngẫu nhiên ±0.002 Bar', () => {
    const samples = [
      { t: 0, p: 0.201 },
      { t: 200, p: 0.199 },
      { t: 400, p: 0.202 },
      { t: 600, p: 0.198 },
      { t: 800, p: 0.200 },
      { t: 1000, p: 0.201 },
    ];
    const slope = slopeBarPerSecond(samples);
    expect(Math.abs(slope)).toBeLessThan(0.01);
  });

  it('xử lý an toàn khi các mẫu có timestamp trùng lặp, không sinh NaN hay Infinity', () => {
    const samples = [
      { t: 100, p: 0.20 },
      { t: 100, p: 0.20 },
      { t: 500, p: 0.15 },
      { t: 500, p: 0.15 },
    ];
    const slope = slopeBarPerSecond(samples);
    expect(Number.isFinite(slope)).toBe(true);
  });
});
