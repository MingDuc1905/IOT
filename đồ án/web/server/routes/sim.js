import { Router } from 'express';
import { simulator, SCENARIOS } from '../services/simulator.js';

export function createSimRouter() {
  const router = Router();

  router.get('/api/sim', (req, res) => {
    res.json({
      status: simulator.getStatus(),
      available_scenarios: Object.keys(SCENARIOS),
    });
  });

  router.post('/api/sim', (req, res) => {
    const scenario = req.body?.scenario || 'idle';
    try {
      simulator.start(scenario);
      res.json({
        success: true,
        message: `Đã kích hoạt kịch bản mô phỏng: ${scenario}`,
        status: simulator.getStatus(),
      });
    } catch (err) {
      res.status(400).json({
        error: {
          code: 'SIM_ERROR',
          message: err.message,
        },
      });
    }
  });

  router.post('/api/sim/stop', (req, res) => {
    simulator.stop();
    res.json({
      success: true,
      message: 'Đã dừng chế độ mô phỏng.',
      status: simulator.getStatus(),
    });
  });

  return router;
}
