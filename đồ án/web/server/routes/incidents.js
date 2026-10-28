import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { createIncidentService } from '../services/incidentService.js';
import { bus } from '../services/bus.js';

const UpdateIncidentSchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED']).optional(),
  staff_name: z.string().optional(),
  action_taken: z.string().optional(),
});

export function createIncidentsRouter() {
  const router = Router();
  const db = getDb();
  const incidentService = createIncidentService(db);

  // GET /api/incidents - Danh sách phiếu sự cố
  router.get('/api/incidents', (req, res) => {
    const filters = {
      status: req.query.status,
      node_id: req.query.node_id,
    };
    const list = incidentService.listIncidents(filters);
    res.json(list);
  });

  // PATCH /api/incidents/:ticket_id - Cập nhật tiến trình xử lý
  router.patch('/api/incidents/:ticket_id', (req, res) => {
    const parseRes = UpdateIncidentSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu cập nhật không hợp lệ.',
          details: parseRes.error.flatten(),
        },
      });
    }

    try {
      const updated = incidentService.updateIncident(req.params.ticket_id, parseRes.data);
      bus.emit('incident_updated', updated);
      res.json(updated);
    } catch (err) {
      res.status(400).json({
        error: {
          code: 'UPDATE_FAILED',
          message: err.message,
        },
      });
    }
  });

  // GET /api/incidents/export.csv - Xuất CSV danh sách sự cố
  router.get('/api/incidents/export.csv', (req, res) => {
    const rows = incidentService.listIncidents();

    const headers = [
      'Mã Sự Cố (Ticket ID)',
      'Trạm Đo (Node ID)',
      'Phân Loại Cảnh Báo (Alert Type)',
      'Áp Suất Kích Hoạt (Bar)',
      'Tốc Độ dP/dt (Bar/s)',
      'Thời Điểm Bắt Đầu (UTC)',
      'Trạng Thái Xử Lý',
      'Nhân Viên Tiếp Nhận',
      'Biện Pháp Khắc Phục',
      'Thời Điểm Hoàn Tất',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = '\uFEFF';
    csvContent += headers.join(',') + '\r\n';

    for (const r of rows) {
      const line = [
        escapeCsv(r.ticket_id),
        escapeCsv(r.node_id),
        escapeCsv(r.alert_type),
        r.trigger_pressure,
        r.trigger_dp_dt,
        escapeCsv(r.start_time),
        escapeCsv(r.status),
        escapeCsv(r.staff_name),
        escapeCsv(r.action_taken),
        escapeCsv(r.resolved_at),
      ].join(',');
      csvContent += line + '\r\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hydrowatch_incidents.csv"');
    res.send(csvContent);
  });

  return router;
}
