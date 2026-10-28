import { CONFIG } from '../config.js';
import { getDb } from '../db/connection.js';
import { createEma } from '../core/ema.js';
import { slopeBarPerSecond } from '../core/derivative.js';
import { classify } from '../core/classifier.js';
import { createIncidentService } from './incidentService.js';
import { simulator } from './simulator.js';
import { bus } from './bus.js';
import { fetchEspData } from './espClient.js';
import { insertPressureLog, cleanupOldLogs } from '../db/logRepository.js';

export class DataPoller {
  constructor(database = getDb()) {
    this.db = database;
    this.incidentService = createIncidentService(database);
    this.timer = null;
    this.cleanerTimer = null;
    this.isPolling = false;

    this.espConnected = false;
    this.lastSampleAt = null;
    this.lastSample = null;

    this.ema = createEma(CONFIG.EMA_ALPHA);
    this.historyBuffer = []; // [{ t: ms, p: Bar }]
    this.classifierState = { rapidDropStreak: 0, lastStatus: 'NORMAL' };
  }

  start() {
    if (this.isPolling) return;
    this.isPolling = true;

    // Vòng lặp lấy mẫu dữ liệu
    this.timer = setInterval(() => this.tick(), CONFIG.POLL_MS);

    // Vòng lặp dọn dẹp log quá 24 giờ (mỗi 5 phút)
    this.cleanerTimer = setInterval(() => this.cleanupOldLogs(), 5 * 60 * 1000);
    this.cleanupOldLogs();
  }

  stop() {
    this.isPolling = false;
    if (this.timer) clearInterval(this.timer);
    if (this.cleanerTimer) clearInterval(this.cleanerTimer);
  }

  async tick(customNow = null) {
    let rawData = null;
    let firmwareStatus = 'NORMAL';
    const isSimActive = simulator.getStatus().active;

    if (isSimActive) {
      rawData = simulator.nextSample(customNow);
      this.espConnected = false;
    } else {
      const espRes = await fetchEspData(CONFIG.ESP_URL);
      if (espRes.success) {
        rawData = espRes.data;
        firmwareStatus = espRes.status;
        this.espConnected = true;
      } else {
        this.espConnected = false;
      }
    }

    if (!rawData) {
      bus.emit('status', {
        esp_connected: this.espConnected,
        sim_active: isSimActive,
        last_sample_at: this.lastSampleAt,
      });
      return;
    }

    // 1. Áp dụng bộ lọc số EMA
    const pRaw = Math.max(0.0, Math.min(CONFIG.P_SENSOR_MAX, rawData.pressure_raw));
    const pFiltered = parseFloat(this.ema.push(pRaw).toFixed(4));

    // 2. Cập nhật buffer lịch sử mẫu để tính dP/dt (~2.0s = 4-5 mẫu)
    const nowMs = customNow !== null ? customNow : Date.now();
    this.historyBuffer.push({ t: nowMs, p: pFiltered });
    if (this.historyBuffer.length > 5) {
      this.historyBuffer.shift();
    }

    // 3. Tính dP/dt bằng hồi quy bình phương tối thiểu
    const dpDt = parseFloat(slopeBarPerSecond(this.historyBuffer).toFixed(4));

    // 4. Phân loại trạng thái độc lập tại backend
    const thresholds = {
      pSensorMax: CONFIG.P_SENSOR_MAX,
      pMin: CONFIG.P_MIN,
      pMax: CONFIG.P_MAX,
      dropThresh: CONFIG.DROP_THRESH,
      dropStreakRequired: CONFIG.DROP_STREAK,
    };

    const classified = classify(this.classifierState, { pressure: pFiltered, dpDt }, thresholds);
    const serverStatus = classified.status;
    this.classifierState = classified.nextState;

    const sampleRecord = {
      node_id: rawData.node_id || 'NODE-01',
      pressure: pFiltered,
      pressure_raw: pRaw,
      dp_dt: dpDt,
      raw_adc: rawData.raw_adc,
      voltage_mv: rawData.voltage_mv,
      status: isSimActive ? serverStatus : firmwareStatus,
      status_server: serverStatus,
      timestamp: rawData.timestamp,
    };

    this.lastSample = sampleRecord;
    this.lastSampleAt = rawData.timestamp;

    // 5. Lưu vào SQLite qua Repository
    insertPressureLog(this.db, sampleRecord);

    // 6. Quản lý vé sự cố
    const effectiveStatus = sampleRecord.status;
    if (effectiveStatus !== 'NORMAL') {
      const ticket = this.incidentService.handleSample(sampleRecord, effectiveStatus);
      if (ticket) {
        bus.emit('incident', ticket);
      }
    }

    // 7. Bắn sự kiện SSE cho client
    bus.emit('sample', {
      ...sampleRecord,
      esp_connected: this.espConnected,
      sim_active: isSimActive,
    });
  }

  cleanupOldLogs() {
    return cleanupOldLogs(this.db, CONFIG.RETENTION_HOURS || 24);
  }
}
