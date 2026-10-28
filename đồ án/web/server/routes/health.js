import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { simulator } from '../services/simulator.js';

export function createHealthRouter(poller) {
  const router = Router();
  const db = getDb();
  const startTime = Date.now();

  router.get('/api/health', (req, res) => {
    let dbOk = false;
    try {
      const row = db.prepare('SELECT 1 as ok').get();
      dbOk = Boolean(row && row.ok === 1);
    } catch {
      dbOk = false;
    }

    res.json({
      status: 'ok',
      db_ok: dbOk,
      esp_connected: poller.espConnected,
      last_sample_at: poller.lastSampleAt,
      sim: simulator.getStatus(),
      uptime_sec: Math.round((Date.now() - startTime) / 1000),
    });
  });

  return router;
}
