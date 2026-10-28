import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'data', 'hydrowatch.db'),
  ESP_URL: process.env.ESP_URL || 'http://192.168.4.1',
  POLL_MS: process.env.POLL_MS ? parseInt(process.env.POLL_MS, 10) : 500,

  // Thông số dải đo cảm biến MPS20N0040D (0 ~ 40 kPa = 0 ~ 0.40 Bar)
  P_SENSOR_MAX: 0.40,
  P_MIN: 0.05,
  P_MAX: 0.35,
  DROP_THRESH: -0.08,
  DROP_STREAK: 2,
  EMA_ALPHA: 0.25,

  // Thời gian lưu trữ log (24 giờ)
  RETENTION_HOURS: 24,
};
