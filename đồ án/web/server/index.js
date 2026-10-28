import express from 'express';
import { CONFIG } from './config.js';
import { getDb, closeDb } from './db/connection.js';
import { migrate } from './db/migrate.js';
import { DataPoller } from './services/poller.js';
import { createLiveRouter } from './routes/live.js';
import { createLogsRouter } from './routes/logs.js';
import { createIncidentsRouter } from './routes/incidents.js';
import { createNodesRouter } from './routes/nodes.js';
import { createSettingsRouter } from './routes/settings.js';
import { createSimRouter } from './routes/sim.js';
import { createHealthRouter } from './routes/health.js';

const app = express();

// Middleware
app.use(express.json());

// Khởi tạo Database & Chạy Migrations
const db = getDb();
migrate(db);

// Khởi tạo Poller thu thập dữ liệu
const poller = new DataPoller(db);
poller.start();

// Mount Routes
app.use(createLiveRouter(poller));
app.use(createLogsRouter());
app.use(createIncidentsRouter());
app.use(createNodesRouter());
app.use(createSettingsRouter());
app.use(createSimRouter());
app.use(createHealthRouter(poller));

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Lỗi xử lý yêu cầu phía máy chủ.',
    },
  });
});

const server = app.listen(CONFIG.PORT, () => {
  console.log(`🚀 HydroWatch V2 Backend đang lắng nghe tại: http://localhost:${CONFIG.PORT}`);
});

// Xử lý đóng an toàn khi tắt tiến trình
const shutdown = () => {
  console.log('🛑 Đang đóng HydroWatch Backend...');
  poller.stop();
  server.close(() => {
    closeDb();
    console.log('✅ Đã đóng kết nối SQLite an toàn.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, poller };
