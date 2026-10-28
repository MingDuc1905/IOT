import { IconShieldCheck } from '@tabler/icons-react';
import { ALERT_META, TICKET_META, metaOf } from './statusMeta.js';

export function IncidentTable({ incidents = [], onOpenModal }) {
  if (incidents.length === 0) {
    return (
      <div className="empty py-5">
        <div className="empty-icon">
          <IconShieldCheck size={48} />
        </div>
        <p className="empty-title">Chưa ghi nhận sự cố nào</p>
        <p className="empty-subtitle text-secondary">
          Hệ thống đường ống đang vận hành an toàn trong dải áp suất tiêu chuẩn.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive" tabIndex={0}>
      <table className="table table-vcenter card-table table-striped table-mobile-md">
        <thead>
          <tr>
            <th>Mã sự cố</th>
            <th>Trạm đo</th>
            <th>Loại cảnh báo</th>
            <th>Áp suất kích hoạt</th>
            <th>Tốc độ dP/dt</th>
            <th>Thời điểm bắt đầu</th>
            <th>Trạng thái</th>
            <th>Nhân viên</th>
            <th className="w-1">
              <span className="visually-hidden">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((t) => {
            const alertMeta = metaOf(ALERT_META, t.alert_type);
            const ticketMeta = metaOf(TICKET_META, t.status);
            const dateStr = t.start_time
              ? new Date(t.start_time).toLocaleString('vi-VN')
              : '---';

            return (
              <tr key={t.ticket_id}>
                <td data-label="Mã sự cố">
                  <span className="font-monospace fw-bold">{t.ticket_id}</span>
                </td>
                <td data-label="Trạm đo" className="text-secondary">
                  {t.node_id}
                </td>
                <td data-label="Loại cảnh báo">
                  <span className={`badge ${alertMeta.badge}`}>{alertMeta.label}</span>
                </td>
                <td data-label="Áp suất kích hoạt" className="font-monospace">
                  {typeof t.trigger_pressure === 'number'
                    ? `${t.trigger_pressure.toFixed(3)} Bar`
                    : '---'}
                </td>
                <td data-label="Tốc độ dP/dt" className="font-monospace">
                  {typeof t.trigger_dp_dt === 'number'
                    ? `${t.trigger_dp_dt.toFixed(3)} Bar/s`
                    : '0.000'}
                </td>
                <td data-label="Thời điểm bắt đầu" className="text-secondary small">
                  {dateStr}
                </td>
                <td data-label="Trạng thái">
                  <span className={`badge ${ticketMeta.badge}`}>{ticketMeta.label}</span>
                </td>
                <td data-label="Nhân viên" className="text-secondary">
                  {t.staff_name || '---'}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onOpenModal(t)}
                  >
                    Cập nhật
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
