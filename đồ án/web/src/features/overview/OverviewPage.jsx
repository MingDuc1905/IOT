import { MetricCards } from './MetricCards.jsx';
import { PressureChart } from './PressureChart.jsx';
import { ThresholdLegend } from './ThresholdLegend.jsx';
import { IconAlertTriangle, IconArrowRight } from '@tabler/icons-react';
import { STATUS_META, metaOf } from '../incidents/statusMeta.js';

export function OverviewPage({
  current,
  history,
  openIncidentsCount,
  settings,
  latestIncident,
  onNavigateToIncidents,
  onStartSim,
}) {
  const currentStatus = current?.status || 'NORMAL';
  const isAlert = currentStatus !== 'NORMAL';
  const alertMeta = metaOf(STATUS_META, currentStatus);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Banner cảnh báo khẩn cấp khi có sự cố */}
      {isAlert && (
        <div className="alert alert-danger d-flex align-items-center mb-0" role="alert">
          <span className="me-2">
            <IconAlertTriangle size={24} />
          </span>
          <div className="flex-fill">
            <strong>CẢNH BÁO BẤT THƯỜNG:</strong> Phát hiện trạng thái{' '}
            <span className="badge bg-red text-white ms-1 me-2">{alertMeta.label}</span>
            {latestIncident?.ticket_id && (
              <span className="text-secondary small">
                (Mã sự cố: <span className="font-monospace">{latestIncident.ticket_id}</span>)
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm ms-3"
            onClick={onNavigateToIncidents}
          >
            Xem phiếu sự cố <IconArrowRight size={16} className="ms-1" />
          </button>
        </div>
      )}

      {/* 4 Thẻ KPI */}
      <MetricCards
        current={current}
        history={history}
        openIncidentsCount={openIncidentsCount}
      />

      {/* Hàng đồ thị và Bảng ngưỡng */}
      <div className="row row-deck row-cards">
        <div className="col-lg-8">
          <PressureChart history={history} onStartSim={onStartSim} />
        </div>
        <div className="col-lg-4">
          <ThresholdLegend settings={settings} />
        </div>
      </div>
    </div>
  );
}
