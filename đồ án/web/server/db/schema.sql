PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Danh mục trạm đo (hỗ trợ đa điểm)
CREATE TABLE IF NOT EXISTS nodes (
  node_id      TEXT PRIMARY KEY,
  label        TEXT NOT NULL,
  location     TEXT,
  esp_url      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bản ghi đo thời gian thực
CREATE TABLE IF NOT EXISTS pressure_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id        TEXT    NOT NULL REFERENCES nodes(node_id),
  pressure       REAL    NOT NULL,   -- Bar, đã qua EMA ở firmware
  pressure_raw   REAL,               -- Bar, trước lọc
  dp_dt          REAL,               -- Bar/s
  raw_adc        INTEGER,
  voltage_mv     REAL,
  status         TEXT    NOT NULL,   -- status do firmware báo
  status_server  TEXT,               -- status backend tự phân loại (đối chiếu)
  timestamp      TEXT    NOT NULL    -- ISO 8601 UTC
);
CREATE INDEX IF NOT EXISTS idx_logs_node_time ON pressure_logs(node_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_status    ON pressure_logs(status);

-- Phiếu sự cố (Incident Tickets)
CREATE TABLE IF NOT EXISTS incidents (
  ticket_id        TEXT PRIMARY KEY,           -- INC-YYYYMMDD-XXX
  node_id          TEXT NOT NULL REFERENCES nodes(node_id),
  alert_type       TEXT NOT NULL CHECK (alert_type IN ('HIGH','LOW','RAPID_DROP')),
  trigger_pressure REAL NOT NULL,
  trigger_dp_dt    REAL,
  start_time       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','INVESTIGATING','RESOLVED')),
  staff_name       TEXT,
  action_taken     TEXT,
  resolved_at      TEXT,
  CHECK (status <> 'RESOLVED' OR resolved_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_inc_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_inc_node   ON incidents(node_id, start_time DESC);
