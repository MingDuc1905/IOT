import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IconActivity } from '@tabler/icons-react';
import { CHART_COLORS } from './chartTheme.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function PressureChart({ history = [], onStartSim }) {
  const labels = history.map((item) => {
    if (!item.timestamp) return '';
    const date = new Date(item.timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  const pressureData = history.map((item) => item.pressure ?? 0.0);
  const dpDtData = history.map((item) => item.dp_dt ?? 0.0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Áp suất (Bar)',
        data: pressureData,
        borderColor: CHART_COLORS.primaryBlue,
        backgroundColor: CHART_COLORS.primaryBlueArea,
        fill: true,
        tension: 0.25,
        yAxisID: 'yPressure',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Tốc độ dP/dt (Bar/s)',
        data: dpDtData,
        borderColor: CHART_COLORS.cyan,
        borderDash: [4, 4],
        fill: false,
        tension: 0.2,
        yAxisID: 'yDpDt',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          color: CHART_COLORS.gridBorder,
        },
        ticks: {
          color: CHART_COLORS.textMuted,
          maxTicksLimit: 10,
        },
      },
      yPressure: {
        type: 'linear',
        position: 'left',
        min: 0.0,
        max: 0.45,
        grid: {
          color: CHART_COLORS.gridBorder,
        },
        ticks: {
          color: CHART_COLORS.primaryBlue,
          callback: (val) => `${val.toFixed(2)} Bar`,
        },
      },
      yDpDt: {
        type: 'linear',
        position: 'right',
        min: -0.25,
        max: 0.25,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: CHART_COLORS.cyan,
          callback: (val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}`,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: CHART_COLORS.textLight,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.gridBorder,
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Đồ thị áp suất &amp; tốc độ biến thiên dP/dt</h2>
          <p className="card-subtitle">
            Lấy mẫu 100ms cận biên, đồng bộ 500ms từ cảm biến MPS20N0040D
          </p>
        </div>
      </div>
      <div className="card-body">
        {history.length === 0 ? (
          <div className="empty" style={{ height: 320 }}>
            <div className="empty-icon">
              <IconActivity size={36} stroke={1.5} />
            </div>
            <p className="empty-title">Chưa có tín hiệu đo áp suất</p>
            <p className="empty-subtitle text-secondary">
              Kết nối trạm đo ESP8266 hoặc kích hoạt kịch bản mô phỏng để quan sát đồ thị thời gian thực.
            </p>
            {onStartSim && (
              <div className="empty-action">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onStartSim('normal')}
                >
                  Kích hoạt mô phỏng
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 320 }}>
            <Line data={data} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}
