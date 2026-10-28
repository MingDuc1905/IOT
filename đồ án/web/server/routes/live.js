import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { bus } from '../services/bus.js';
import { simulator } from '../services/simulator.js';

export function createLiveRouter(poller) {
  const router = Router();
  const db = getDb();

  // GET /api/live?node_id=NODE-01 - Snapshot dữ liệu mới nhất và 120 điểm gần nhất
  router.get('/api/live', (req, res) => {
    const nodeId = req.query.node_id || 'NODE-01';

    const history = db
      .prepare(`
        SELECT * FROM pressure_logs
        WHERE node_id = ?
        ORDER BY timestamp DESC
        LIMIT 120
      `)
      .all(nodeId)
      .reverse(); // Đảo lại theo thứ tự thời gian tăng dần cho chart

    res.json({
      current: poller.lastSample,
      history,
      connected: poller.espConnected,
      sim: simulator.getStatus(),
    });
  });

  // GET /stream - Luồng Server-Sent Events (SSE) thời gian thực
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Gửi sự kiện khởi tạo ngay khi nối
    sendEvent('init', {
      connected: poller.espConnected,
      sim: simulator.getStatus(),
      lastSample: poller.lastSample,
    });

    const onSample = (sample) => sendEvent('sample', sample);
    const onIncident = (incident) => sendEvent('incident', incident);
    const onStatus = (status) => sendEvent('status', status);

    bus.on('sample', onSample);
    bus.on('incident', onIncident);
    bus.on('status', onStatus);

    // Heartbeat định kỳ giữ kết nối không bị đóng bởi proxy
    const pingTimer = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(pingTimer);
      bus.off('sample', onSample);
      bus.off('incident', onIncident);
      bus.off('status', onStatus);
    });
  });

  return router;
}
