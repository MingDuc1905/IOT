import { useState } from 'react';
import { IncidentTable } from './IncidentTable.jsx';
import { IncidentModal } from './IncidentModal.jsx';
import { IconDownload, IconFilter } from '@tabler/icons-react';

export function IncidentsPage({ incidents, onUpdateIncident, onRefresh }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredIncidents = incidents.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const handleOpenModal = (incident) => {
    setSelectedIncident(incident);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedIncident(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Quản lý vòng đời sự cố (Incident Lifecycle)</h2>
          <p className="card-subtitle">
            Theo dõi, phân công kỹ thuật viên và nhật ký khắc phục sự cố đường ống
          </p>
        </div>
        <div className="card-actions d-flex align-items-center gap-2 ms-auto">
          <div className="d-flex align-items-center gap-1">
            <IconFilter size={18} className="text-secondary" />
            <select
              className="form-select form-select-sm w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
              <option value="INVESTIGATING">Đang kiểm tra (INVESTIGATING)</option>
              <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
            </select>
          </div>

          <a
            href="/api/incidents/export.csv"
            className="btn btn-sm btn-outline-secondary"
            download="hydrowatch_incidents.csv"
          >
            <IconDownload size={16} className="me-1" />
            Xuất CSV
          </a>
        </div>
      </div>

      <IncidentTable incidents={filteredIncidents} onOpenModal={handleOpenModal} />

      <IncidentModal
        open={modalOpen}
        incident={selectedIncident}
        onClose={handleCloseModal}
        onSave={async (ticketId, data) => {
          await onUpdateIncident(ticketId, data);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
