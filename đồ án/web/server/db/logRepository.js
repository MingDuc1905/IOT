/**
 * Quản lý lưu trữ và dọn dẹp nhật ký đo áp suất (pressure_logs) trong SQLite
 */

export function insertPressureLog(db, record) {
  try {
    const stmt = db.prepare(`
      INSERT INTO pressure_logs (
        node_id, pressure, pressure_raw, dp_dt, raw_adc, voltage_mv, status, status_server, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.node_id,
      record.pressure,
      record.pressure_raw,
      record.dp_dt,
      record.raw_adc,
      record.voltage_mv,
      record.status,
      record.status_server,
      record.timestamp
    );
  } catch (err) {
    console.error('[REPO] Lỗi lưu pressure_logs:', err.message);
  }
}

export function cleanupOldLogs(db, retentionHours = 24) {
  try {
    const res = db
      .prepare(`DELETE FROM pressure_logs WHERE timestamp < datetime('now', ? || ' hours')`)
      .run(`-${retentionHours}`);

    if (res.changes > 0) {
      console.log(`[CLEANER] Đã dọn dẹp ${res.changes} bản ghi log cũ hơn ${retentionHours} giờ.`);
    }
    return res.changes;
  } catch (err) {
    console.error('[CLEANER] Lỗi dọn dẹp log:', err.message);
    return 0;
  }
}
