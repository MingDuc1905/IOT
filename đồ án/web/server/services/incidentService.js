import { nextTicketId } from '../core/ticketId.js';

export function mapStatusToAlertType(status) {
  switch (status) {
    case 'HIGH_PRESSURE':
    case 'HIGH':
      return 'HIGH';
    case 'LOW_PRESSURE':
    case 'LOW':
      return 'LOW';
    case 'RAPID_DROP':
      return 'RAPID_DROP';
    default:
      return null;
  }
}

export function createIncidentService(database) {
  return {
    handleSample(sample, status) {
      const alertType = mapStatusToAlertType(status);
      if (!alertType) {
        return null;
      }

      const nodeId = sample.node_id || 'NODE-01';

      // 1. Kiểm tra xem sự cố cùng loại ở trạm này đã có ticket đang mở (PENDING / INVESTIGATING) chưa
      const existingOpen = database
        .prepare(`
          SELECT * FROM incidents
          WHERE node_id = ? AND alert_type = ? AND status IN ('PENDING', 'INVESTIGATING')
          LIMIT 1
        `)
        .get(nodeId, alertType);

      if (existingOpen) {
        return existingOpen; // Đã có ticket đang mở -> không sinh lặp
      }

      // 2. Lấy danh sách ticket_id trong ngày để sinh ID tăng dần
      const startTime = sample.timestamp || new Date().toISOString();
      const datePart = startTime.slice(0, 10);
      const cleanDate = datePart.replace(/-/g, '');
      const prefix = `INC-${cleanDate}-%`;

      const existingRows = database
        .prepare(`SELECT ticket_id FROM incidents WHERE ticket_id LIKE ?`)
        .all(prefix);

      const existingIds = existingRows.map((r) => r.ticket_id);
      const ticketId = nextTicketId(datePart, existingIds);

      // 3. Ghi vào database
      const insertStmt = database.prepare(`
        INSERT INTO incidents (
          ticket_id, node_id, alert_type, trigger_pressure, trigger_dp_dt, start_time, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
      `);

      insertStmt.run(
        ticketId,
        nodeId,
        alertType,
        sample.pressure,
        sample.dp_dt || 0.0,
        startTime
      );

      return database.prepare(`SELECT * FROM incidents WHERE ticket_id = ?`).get(ticketId);
    },

    listIncidents(filters = {}) {
      let query = `SELECT * FROM incidents WHERE 1=1`;
      const params = [];

      if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
      }
      if (filters.node_id) {
        query += ` AND node_id = ?`;
        params.push(filters.node_id);
      }

      query += ` ORDER BY start_time DESC`;
      return database.prepare(query).all(...params);
    },

    updateIncident(ticketId, updates) {
      const current = database.prepare(`SELECT * FROM incidents WHERE ticket_id = ?`).get(ticketId);
      if (!current) {
        throw new Error(`Không tìm thấy sự cố với mã: ${ticketId}`);
      }

      const newStatus = updates.status || current.status;
      const staffName = updates.staff_name !== undefined ? updates.staff_name : current.staff_name;
      const actionTaken = updates.action_taken !== undefined ? updates.action_taken : current.action_taken;

      if (newStatus === 'RESOLVED') {
        if (!actionTaken || typeof actionTaken !== 'string' || !actionTaken.trim()) {
          throw new Error('Biện pháp khắc phục (action_taken) bắt buộc phải có khi đóng phiếu sự cố.');
        }
      }

      const resolvedAt =
        newStatus === 'RESOLVED'
          ? updates.resolved_at || current.resolved_at || new Date().toISOString()
          : null;

      const updateStmt = database.prepare(`
        UPDATE incidents
        SET status = ?, staff_name = ?, action_taken = ?, resolved_at = ?
        WHERE ticket_id = ?
      `);

      updateStmt.run(newStatus, staffName, actionTaken, resolvedAt, ticketId);
      return database.prepare(`SELECT * FROM incidents WHERE ticket_id = ?`).get(ticketId);
    },
  };
}
