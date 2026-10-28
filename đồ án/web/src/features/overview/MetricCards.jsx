import { useEffect, useRef } from 'react';
import {
  IconActivity,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { STATUS_META, metaOf } from '../incidents/statusMeta.js';

function Sparkline({ values, type = 'line', fill, spot, color = 'blue', ariaLabel }) {
  const ref = useRef(null);
  const serialized =
    Array.isArray(values) && values.length > 0 ? values.join(',') : '0';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.tabler?.Sparkline && ref.current) {
      const instance = window.tabler.Sparkline.getOrCreateInstance(ref.current, {
        type,
        fill: fill === 'auto',
        spot,
        animation: 0,
      });
      instance.update(serialized);
    }
  }, [serialized, type, fill, spot]);

  return (
    <span
      ref={ref}
      key={serialized}
      className={`sparkline text-${color}`}
      data-bs-toggle="sparkline"
      data-bs-type={type}
      data-bs-fill={fill || undefined}
      data-bs-spot={spot || undefined}
      data-bs-values={serialized}
      aria-label={ariaLabel}
      style={{
        '--tblr-sparkline-width': '100%',
        '--tblr-sparkline-height': '2.5rem',
        width: '100%',
        height: '2.5rem',
        display: 'block',
      }}
    />
  );
}

export function MetricCards({ current, history = [], openIncidentsCount = 0 }) {
  const pressureVal =
    typeof current?.pressure === 'number' ? current.pressure.toFixed(3) : '0.000';

  const dpDtNum = typeof current?.dp_dt === 'number' ? current.dp_dt : 0.0;
  const dpDtSign = dpDtNum > 0 ? `+${dpDtNum.toFixed(3)}` : dpDtNum.toFixed(3);

  const statusKey = current?.status || 'NORMAL';
  const statusMeta = metaOf(STATUS_META, statusKey);

  const incidentAvatarClass = openIncidentsCount > 0 ? 'bg-red-lt' : 'bg-green-lt';

  const recent = (history || []).slice(-20);
  const pressureValues =
    recent.length > 0
      ? recent.map((item) => Number((item.pressure ?? 0).toFixed(3)))
      : [Number(pressureVal)];
  const dpDtValues =
    recent.length > 0
      ? recent.map((item) => Number((item.dp_dt ?? 0).toFixed(3)))
      : [Number(dpDtNum.toFixed(3))];

  return (
    <div className="row row-deck row-cards">
      {/* KPI 1: Áp suất hiện tại - Sparkline Line */}
      <div className="col-sm-6 col-lg-3">
        <div className="card">
          <div className="card-body pb-0">
            <div className="subheader mb-1">Áp suất hiện tại</div>
            <div className="h3 m-0">
              {pressureVal} <span className="text-secondary fs-4">Bar</span>
            </div>
          </div>
          <Sparkline
            type="line"
            fill="auto"
            spot="last"
            color="blue"
            values={pressureValues}
            ariaLabel="Xu hướng áp suất"
          />
        </div>
      </div>

      {/* KPI 2: Tốc độ biến thiên dP/dt - Sparkline Bar */}
      <div className="col-sm-6 col-lg-3">
        <div className="card">
          <div className="card-body pb-0">
            <div className="subheader mb-1">Tốc độ biến thiên (dP/dt)</div>
            <div className="h3 m-0">
              {dpDtSign} <span className="text-secondary fs-4">Bar/s</span>
            </div>
          </div>
          <Sparkline
            type="bar"
            color="blue"
            values={dpDtValues}
            ariaLabel="Xu hướng tốc độ biến thiên dP/dt"
          />
        </div>
      </div>

      {/* KPI 3: Trạng thái trạm đo */}
      <div className="col-sm-6 col-lg-3">
        <div className="card">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col">
                <div className="subheader mb-1">Trạng thái hệ thống</div>
                <div className="h3 m-0">
                  <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                </div>
              </div>
              <div className="col-auto">
                <span className={`avatar avatar-lg ${statusMeta.avatar}`}>
                  <IconActivity size={28} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 4: Sự cố đang mở */}
      <div className="col-sm-6 col-lg-3">
        <div className="card">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col">
                <div className="subheader mb-1">Sự cố đang mở</div>
                <div className="h3 m-0">
                  {openIncidentsCount} <span className="text-secondary fs-4">phiếu</span>
                </div>
              </div>
              <div className="col-auto">
                <span className={`avatar avatar-lg ${incidentAvatarClass}`}>
                  <IconAlertTriangle size={28} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
