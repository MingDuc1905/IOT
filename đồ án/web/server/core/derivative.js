/**
 * Tính đạo hàm biến thiên áp suất dP/dt (Bar/giây)
 * Sử dụng phương pháp hồi quy tuyến tính bình phương tối thiểu (Ordinary Least Squares - OLS)
 * giúp triệt tiêu nhiễu dao động tốt hơn so với sai phân 2 điểm đơn thuần.
 */
export function slopeBarPerSecond(samples) {
  if (!Array.isArray(samples) || samples.length < 3) {
    return 0.0;
  }

  // Lọc các mẫu hợp lệ (có t và p là số hữu hạn)
  const valid = samples.filter(
    (s) => s && typeof s.t === 'number' && typeof s.p === 'number' && Number.isFinite(s.t) && Number.isFinite(s.p)
  );

  if (valid.length < 3) {
    return 0.0;
  }

  const tStart = valid[0].t;
  const tEnd = valid[valid.length - 1].t;
  const deltaT = tEnd - tStart;

  // Cửa sổ thời gian tối thiểu 200ms để đảm bảo độ tin cậy
  if (Math.abs(deltaT) < 200) {
    return 0.0;
  }

  const n = valid.length;
  let sumT = 0.0;
  let sumP = 0.0;
  let sumTP = 0.0;
  let sumT2 = 0.0;

  // Dùng t tương đối so với tStart để tránh tràn số và giữ độ chính xác float
  for (let i = 0; i < n; i++) {
    const tRel = valid[i].t - tStart; // ms
    const p = valid[i].p;
    sumT += tRel;
    sumP += p;
    sumTP += tRel * p;
    sumT2 += tRel * tRel;
  }

  const denominator = n * sumT2 - sumT * sumT;
  if (Math.abs(denominator) < 1e-9) {
    return 0.0;
  }

  const slopePerMs = (n * sumTP - sumT * sumP) / denominator;
  const slopePerSec = slopePerMs * 1000.0;

  return slopePerSec;
}
