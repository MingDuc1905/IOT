import { fetch } from 'undici';
import { z } from 'zod';

const EspPayloadSchema = z.object({
  node_id: z.string().default('NODE-01'),
  pressure: z.number(),
  pressure_raw: z.number().optional(),
  dp_dt: z.number().optional(),
  adc: z.number().int().optional(),
  raw_adc: z.number().int().optional(),
  voltage_mv: z.number().optional(),
  status: z.string().default('NORMAL'),
  simulated: z.boolean().optional(),
  sensor_ok: z.boolean().optional(),
  calibrated: z.boolean().optional(),
});

/**
 * Thu thập dữ liệu từ trạm đo ESP8266 qua HTTP GET /api/data
 * Có timeout 400ms và xác thực định dạng payload bằng Zod.
 */
export async function fetchEspData(espUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400);

    const res = await fetch(`${espUrl}/api/data`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false };
    }

    const json = await res.json();
    const parsed = EspPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return { success: false };
    }

    const rawData = {
      node_id: parsed.data.node_id,
      pressure_raw: parsed.data.pressure_raw ?? parsed.data.pressure,
      voltage_mv: parsed.data.voltage_mv ?? 0.0,
      raw_adc: parsed.data.raw_adc ?? parsed.data.adc ?? 0,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      data: rawData,
      status: parsed.data.status,
    };
  } catch {
    return { success: false };
  }
}
