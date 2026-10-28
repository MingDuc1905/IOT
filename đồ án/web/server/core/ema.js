/**
 * Thuật toán lọc số mũ Exponential Moving Average (EMA)
 * Công thức: pFiltered[k] = alpha * pRaw[k] + (1 - alpha) * pFiltered[k - 1]
 */
export function emaStep(prev, raw, alpha) {
  if (typeof alpha !== 'number' || alpha <= 0 || alpha > 1 || Number.isNaN(alpha)) {
    throw new Error(`Hệ số alpha không hợp lệ (${alpha}). Alpha bắt buộc phải nằm trong (0, 1].`);
  }

  if (prev === null || prev === undefined || Number.isNaN(prev)) {
    return raw;
  }

  return alpha * raw + (1.0 - alpha) * prev;
}

export function createEma(alpha) {
  let currentValue = null;

  return {
    push(raw) {
      currentValue = emaStep(currentValue, raw, alpha);
      return currentValue;
    },
    current() {
      return currentValue;
    },
    reset() {
      currentValue = null;
    },
  };
}
