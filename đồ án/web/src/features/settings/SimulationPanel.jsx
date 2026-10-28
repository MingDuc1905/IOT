import { api } from '../../api/client.js';
import {
  IconFlask,
  IconPlayerPlay,
  IconPlayerStop,
} from '@tabler/icons-react';

export function SimulationPanel({ simActive, currentScenario }) {
  const handleStartSim = async (scenario) => {
    try {
      await api.startSim(scenario);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStopSim = async () => {
    try {
      await api.stopSim();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Kịch bản mô phỏng thực nghiệm</h2>
          <p className="card-subtitle">
            Mô hình thủy lực xi-lanh nén khí phục vụ thuyết trình bảo vệ đồ án
          </p>
        </div>
      </div>

      <div className="card-body">
        {simActive && (
          <div className="alert alert-warning py-2 small mb-3">
            Đang chạy mô phỏng: <strong className="text-uppercase">{currentScenario}</strong>
          </div>
        )}

        <div className="d-flex flex-column gap-2">
          <button
            type="button"
            className="btn btn-outline-success text-start d-flex align-items-center justify-content-between p-2"
            onClick={() => handleStartSim('tapUsage')}
          >
            <div>
              <div className="fw-bold">Kịch bản 1: Mở vòi nước sinh hoạt</div>
              <div className="text-secondary small">
                Tụt áp nhẹ (&sim; -0.02 Bar/s) rồi hồi áp &rarr; Không báo động
              </div>
            </div>
            <IconPlayerPlay size={20} />
          </button>

          <button
            type="button"
            className="btn btn-outline-danger text-start d-flex align-items-center justify-content-between p-2"
            onClick={() => handleStartSim('pipeBurst')}
          >
            <div>
              <div className="fw-bold">Kịch bản 2: Bục vỡ đường ống</div>
              <div className="text-secondary small">
                Tụt dốc dP/dt &le; -0.08 Bar/s liên tục &rarr; Kích hoạt RAPID_DROP
              </div>
            </div>
            <IconPlayerPlay size={20} />
          </button>

          <button
            type="button"
            className="btn btn-outline-warning text-start d-flex align-items-center justify-content-between p-2"
            onClick={() => handleStartSim('overPressure')}
          >
            <div>
              <div className="fw-bold">Kịch bản 3: Quá áp (Búa nước)</div>
              <div className="text-secondary small">
                Áp suất tăng vọt lên 0.38 Bar &gt; 0.35 Bar &rarr; HIGH_PRESSURE
              </div>
            </div>
            <IconPlayerPlay size={20} />
          </button>

          <button
            type="button"
            className="btn btn-outline-info text-start d-flex align-items-center justify-content-between p-2"
            onClick={() => handleStartSim('supplyLoss')}
          >
            <div>
              <div className="fw-bold">Kịch bản 4: Mất nguồn cấp nước</div>
              <div className="text-secondary small">
                Áp suất tụt dần dưới 0.05 Bar &rarr; LOW_PRESSURE
              </div>
            </div>
            <IconPlayerPlay size={20} />
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2"
            onClick={() => handleStartSim('idle')}
          >
            <div>
              <div className="fw-bold">Trạng thái ổn định (Idle)</div>
              <div className="text-secondary small">Áp suất bình thường 0.22 Bar</div>
            </div>
            <IconFlask size={20} />
          </button>

          {simActive && (
            <button
              type="button"
              className="btn btn-danger mt-2"
              onClick={handleStopSim}
            >
              <IconPlayerStop size={18} className="me-1" />
              Dừng chế độ mô phỏng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
