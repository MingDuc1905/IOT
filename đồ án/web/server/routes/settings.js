import { Router } from 'express';
import { z } from 'zod';
import { CONFIG } from '../config.js';

const SettingsUpdateSchema = z.object({
  esp_url: z.string().url().optional(),
  poll_ms: z.number().int().min(100).max(10000).optional(),
  p_min: z.number().min(0.0).max(0.40).optional(),
  p_max: z.number().min(0.0).max(0.40).optional(),
  drop_thresh: z.number().max(0.0).optional(),
  drop_streak: z.number().int().min(1).max(20).optional(),
  ema_alpha: z.number().min(0.01).max(1.0).optional(),
});

export function createSettingsRouter() {
  const router = Router();

  // GET /api/settings - Trả về cấu hình hệ thống và ngưỡng hiện hành
  router.get('/api/settings', (req, res) => {
    res.json({
      esp_url: CONFIG.ESP_URL,
      poll_ms: CONFIG.POLL_MS,
      p_sensor_max: CONFIG.P_SENSOR_MAX,
      p_min: CONFIG.P_MIN,
      p_max: CONFIG.P_MAX,
      drop_thresh: CONFIG.DROP_THRESH,
      drop_streak: CONFIG.DROP_STREAK,
      ema_alpha: CONFIG.EMA_ALPHA,
      retention_hours: CONFIG.RETENTION_HOURS,
    });
  });

  // PUT /api/settings - Cập nhật thông số hệ thống
  router.put('/api/settings', (req, res) => {
    const parsed = SettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu cấu hình không hợp lệ.',
          details: parsed.error.flatten(),
        },
      });
    }

    const data = parsed.data;
    if (data.esp_url !== undefined) CONFIG.ESP_URL = data.esp_url;
    if (data.poll_ms !== undefined) CONFIG.POLL_MS = data.poll_ms;
    if (data.p_min !== undefined) CONFIG.P_MIN = data.p_min;
    if (data.p_max !== undefined) CONFIG.P_MAX = data.p_max;
    if (data.drop_thresh !== undefined) CONFIG.DROP_THRESH = data.drop_thresh;
    if (data.drop_streak !== undefined) CONFIG.DROP_STREAK = data.drop_streak;
    if (data.ema_alpha !== undefined) CONFIG.EMA_ALPHA = data.ema_alpha;

    res.json({
      success: true,
      message: 'Cập nhật cấu hình thành công.',
      settings: {
        esp_url: CONFIG.ESP_URL,
        poll_ms: CONFIG.POLL_MS,
        p_sensor_max: CONFIG.P_SENSOR_MAX,
        p_min: CONFIG.P_MIN,
        p_max: CONFIG.P_MAX,
        drop_thresh: CONFIG.DROP_THRESH,
        drop_streak: CONFIG.DROP_STREAK,
        ema_alpha: CONFIG.EMA_ALPHA,
      },
    });
  });

  return router;
}
