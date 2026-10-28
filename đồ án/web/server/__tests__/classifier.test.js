import { describe, it, expect } from 'vitest';
import { classify } from '../core/classifier.js';

const THRESHOLDS = {
  pSensorMax: 0.40,
  pMin: 0.05,
  pMax: 0.35,
  dropThresh: -0.08,
  dropStreakRequired: 3,
};

describe('State Classifier (Phân loại trạng thái hệ thống)', () => {
  it('phân loại NORMAL khi áp suất ở mức 0.22 Bar và dP/dt ổn định', () => {
    const state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
    const sample = { pressure: 0.22, dpDt: 0.0 };
    const result = classify(state, sample, THRESHOLDS);
    expect(result.status).toBe('NORMAL');
    expect(result.nextState.rapidDropStreak).toBe(0);
  });

  it('phân loại HIGH_PRESSURE khi áp suất vượt ngưỡng P_MAX (0.38 Bar > 0.35 Bar)', () => {
    const state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
    const sample = { pressure: 0.38, dpDt: 0.01 };
    const result = classify(state, sample, THRESHOLDS);
    expect(result.status).toBe('HIGH_PRESSURE');
  });

  it('phân loại LOW_PRESSURE khi áp suất dưới ngưỡng P_MIN (0.03 Bar < 0.05 Bar)', () => {
    const state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
    const sample = { pressure: 0.03, dpDt: -0.01 };
    const result = classify(state, sample, THRESHOLDS);
    expect(result.status).toBe('LOW_PRESSURE');
  });

  it('chống báo động sai: dP/dt = -0.09 Bar/s trong 1 chu kỳ thì CHƯA kích hoạt RAPID_DROP', () => {
    const state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
    const sample = { pressure: 0.20, dpDt: -0.09 };
    const result = classify(state, sample, THRESHOLDS);
    expect(result.status).toBe('NORMAL');
    expect(result.nextState.rapidDropStreak).toBe(1);
  });

  it('kích hoạt RAPID_DROP khi dP/dt = -0.09 Bar/s liên tục qua 3 chu kỳ', () => {
    let state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };

    // Chu kỳ 1
    state = classify(state, { pressure: 0.22, dpDt: -0.09 }, THRESHOLDS).nextState;
    expect(state.rapidDropStreak).toBe(1);

    // Chu kỳ 2
    state = classify(state, { pressure: 0.17, dpDt: -0.09 }, THRESHOLDS).nextState;
    expect(state.rapidDropStreak).toBe(2);

    // Chu kỳ 3: Đạt ngưỡng
    const res = classify(state, { pressure: 0.12, dpDt: -0.09 }, THRESHOLDS);
    expect(res.status).toBe('RAPID_DROP');
    expect(res.nextState.rapidDropStreak).toBe(3);
  });

  it('kịch bản mở vòi nước sinh hoạt (-0.02, -0.02, -0.01, 0) KHÔNG BAO GIỜ báo động', () => {
    let state = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
    const samples = [
      { pressure: 0.24, dpDt: -0.02 },
      { pressure: 0.20, dpDt: -0.02 },
      { pressure: 0.17, dpDt: -0.01 },
      { pressure: 0.16, dpDt: 0.00 },
    ];

    for (const s of samples) {
      const res = classify(state, s, THRESHOLDS);
      expect(res.status).toBe('NORMAL');
      state = res.nextState;
    }
  });

  it('chặn nhiễu: dP/dt = -0.09 nhưng áp suất đang ở vùng gần max (0.39 Bar) thì không coi là vỡ ống', () => {
    const state = { rapidDropStreak: 0, lastStatus: 'HIGH_PRESSURE' };
    const sample = { pressure: 0.39, dpDt: -0.09 };
    const result = classify(state, sample, THRESHOLDS);
    expect(result.status).toBe('HIGH_PRESSURE');
    expect(result.nextState.rapidDropStreak).toBe(0);
  });

  it('streak tự giảm dần khi nhịp dốc dừng lại, chống nhảy trạng thái chập chờn', () => {
    let state = { rapidDropStreak: 2, lastStatus: 'NORMAL' };
    // Mẫu này dP/dt hồi phục về dương
    const result = classify(state, { pressure: 0.20, dpDt: 0.02 }, THRESHOLDS);
    expect(result.nextState.rapidDropStreak).toBe(1);
  });
});
