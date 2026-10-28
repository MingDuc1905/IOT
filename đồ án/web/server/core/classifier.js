/**
 * Máy trạng thái phân loại trạng thái hệ thống:
 * 1. NORMAL: Áp suất nằm trong dải làm việc tiêu chuẩn (P_min <= P <= P_max).
 * 2. HIGH_PRESSURE: P > P_max (Nguy cơ bục vỡ ống, búa nước).
 * 3. LOW_PRESSURE: P < P_min (Mất nguồn cấp, rò rỉ nhỏ kéo dài).
 * 4. RAPID_DROP: Tốc độ tụt dốc dP/dt <= dropThresh kéo dài liên tục >= dropStreak chu kỳ.
 *
 * Phân biệt mở vòi sinh hoạt vs bục vỡ ống:
 * - Mở vòi: dP/dt âm nhẹ (> -0.08), chỉ xuất hiện 1-2 mẫu rồi hồi áp hoặc ổn định -> không bao giờ đủ streak.
 * - Bục vỡ ống: dP/dt tụt sâu âm liên tục qua >= 3 chu kỳ đo và áp suất tụt dần -> RAPID_DROP.
 */
export function classify(state, sample, thresholds) {
  const {
    pSensorMax = 0.40,
    pMin = 0.05,
    pMax = 0.35,
    dropThresh = -0.08,
    dropStreakRequired = 3,
  } = thresholds;

  let streak = state?.rapidDropStreak || 0;
  const p = sample.pressure;
  const dpDt = sample.dpDt;

  // Điều kiện kiểm tra sụt áp đột ngột:
  // dP/dt âm vượt ngưỡng VÀ áp suất không ở mức sát trần P_SENSOR_MAX (tránh nhiễu khi đang nén khí mạnh)
  const isRapidDropCandidate = dpDt <= dropThresh && p < pSensorMax * 0.7;

  if (isRapidDropCandidate) {
    streak += 1;
  } else {
    // Giảm dần streak chống nhảy trạng thái chập chờn khi có 1 mẫu nhiễu
    streak = Math.max(0, streak - 1);
  }

  let status = 'NORMAL';

  if (streak >= dropStreakRequired) {
    status = 'RAPID_DROP';
  } else if (p > pMax) {
    status = 'HIGH_PRESSURE';
  } else if (p < pMin) {
    status = 'LOW_PRESSURE';
  } else {
    status = 'NORMAL';
  }

  return {
    status,
    nextState: {
      rapidDropStreak: streak,
      lastStatus: status,
    },
  };
}
