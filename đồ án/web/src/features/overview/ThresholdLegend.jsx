export function ThresholdLegend({ settings }) {
  const pMin = settings?.p_min ?? 0.05;
  const pMax = settings?.p_max ?? 0.35;
  const dropThresh = settings?.drop_thresh ?? -0.08;
  const dropStreak = settings?.drop_streak ?? 2;
  const pSensorMax = settings?.p_sensor_max ?? 0.40;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Ngưỡng vận hành &amp; Tiêu chuẩn cảnh báo</h2>
      </div>
      <div className="card-body">
        <div className="datagrid">
          <div className="datagrid-item">
            <div className="datagrid-title">Áp suất bình thường</div>
            <div className="datagrid-content">
              <span className="badge bg-green-lt me-1">NORMAL</span>
              <span className="font-monospace">
                {pMin.toFixed(2)} &sim; {pMax.toFixed(2)} Bar
              </span>
            </div>
          </div>

          <div className="datagrid-item">
            <div className="datagrid-title">Bục vỡ ống (Vỡ đột ngột)</div>
            <div className="datagrid-content">
              <span className="badge bg-red-lt me-1">RAPID DROP</span>
              <span className="font-monospace">
                dP/dt &le; {dropThresh.toFixed(2)} Bar/s ({dropStreak} chu kỳ)
              </span>
            </div>
          </div>

          <div className="datagrid-item">
            <div className="datagrid-title">Quá áp (Búa nước)</div>
            <div className="datagrid-content">
              <span className="badge bg-orange-lt me-1">HIGH PRESSURE</span>
              <span className="font-monospace">&gt; {pMax.toFixed(2)} Bar</span>
            </div>
          </div>

          <div className="datagrid-item">
            <div className="datagrid-title">Mất áp / Rò rỉ</div>
            <div className="datagrid-content">
              <span className="badge bg-azure-lt me-1">LOW PRESSURE</span>
              <span className="font-monospace">&lt; {pMin.toFixed(2)} Bar</span>
            </div>
          </div>

          <div className="datagrid-item">
            <div className="datagrid-title">Cảm biến MPS20N0040D</div>
            <div className="datagrid-content text-secondary">
              <span className="font-monospace">0 &sim; {pSensorMax.toFixed(2)} Bar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
