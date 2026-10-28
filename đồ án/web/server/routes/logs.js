import { Router } from 'express';
import { getDb } from '../db/connection.js';

export function createLogsRouter() {
  const router = Router();
  const db = getDb();

  // GET /api/logs - Lấy danh sách nhật ký phân trang
  router.get('/api/logs', (req, res) => {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '100', 10)));
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10));
    const nodeId = req.query.node_id;
    const status = req.query.status;
    const from = req.query.from;
    const to = req.query.to;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (nodeId) {
      whereClause += ' AND node_id = ?';
      params.push(nodeId);
    }
    if (status) {
      whereClause += ' AND (status = ? OR status_server = ?)';
      params.push(status, status);
    }
    if (from) {
      whereClause += ' AND timestamp >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND timestamp <= ?';
      params.push(to);
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM pressure_logs ${whereClause}`).get(...params);
    const total = countRow ? countRow.total : 0;

    const rows = db
      .prepare(`SELECT * FROM pressure_logs ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    res.json({
      total,
      limit,
      offset,
      data: rows,
    });
  });

  // DELETE /api/logs - Xóa nhật ký đo
  router.delete('/api/logs', (req, res) => {
    const nodeId = req.query.node_id;
    if (nodeId) {
      db.prepare('DELETE FROM pressure_logs WHERE node_id = ?').run(nodeId);
    } else {
      db.prepare('DELETE FROM pressure_logs').run();
    }
    res.json({ success: true, message: 'Đã xóa nhật ký đo thành công.' });
  });

  // GET /api/logs/export.csv - Xuất CSV chuẩn RFC 4180 có UTF-8 BOM
  router.get('/api/logs/export.csv', (req, res) => {
    const rows = db.prepare('SELECT * FROM pressure_logs ORDER BY timestamp DESC LIMIT 5000').all();

    const headers = [
      'ID',
      'Node ID',
      'Timestamp (UTC)',
      'Pressure (Bar)',
      'Pressure Raw (Bar)',
      'dP/dt (Bar/s)',
      'ADC',
      'Voltage (mV)',
      'Firmware Status',
      'Server Status',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM cho Excel
    csvContent += headers.join(',') + '\r\n';

    for (const r of rows) {
      const line = [
        r.id,
        escapeCsv(r.node_id),
        escapeCsv(r.timestamp),
        r.pressure,
        r.pressure_raw,
        r.dp_dt,
        r.raw_adc,
        r.voltage_mv,
        escapeCsv(r.status),
        escapeCsv(r.status_server),
      ].join(',');
      csvContent += line + '\r\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hydrowatch_pressure_logs.csv"');
    res.send(csvContent);
  });

  return router;
}
