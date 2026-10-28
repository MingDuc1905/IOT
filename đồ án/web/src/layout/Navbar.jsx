import {
  IconDroplet,
  IconChartLine,
  IconAlertTriangle,
  IconDatabase,
  IconSettings,
} from '@tabler/icons-react';

export function Navbar({ activeTab, onSelectTab, connected, simActive, openIncidentsCount = 0 }) {
  const getStatusInfo = () => {
    if (simActive) {
      return {
        dotClass: 'status-dot status-dot-animated status-orange',
        label: 'MÔ PHỎNG',
        srText: 'Đang chạy mô phỏng vật lý',
      };
    }
    if (connected) {
      return {
        dotClass: 'status-dot status-dot-animated status-green',
        label: 'Trực tuyến',
        srText: 'ESP8266 đang trực tuyến',
      };
    }
    return {
      dotClass: 'status-dot status-red',
      label: 'Mất kết nối',
      srText: 'Mất kết nối tới ESP8266',
    };
  };

  const status = getStatusInfo();

  return (
    <header className="navbar navbar-expand-md d-print-none">
      <div className="container-xl">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbar-menu"
          aria-label="Mở menu điều hướng"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="navbar-brand navbar-brand-autodark pe-0 pe-md-3">
          <span className="avatar avatar-sm bg-blue-lt me-2">
            <IconDroplet size={20} />
          </span>
          <span className="fw-bold">HydroWatch</span>
        </div>

        {/* Khối trạng thái kết nối nằm bên phải */}
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item d-flex align-items-center me-3">
            <span className={`${status.dotClass} me-2`}>
              <span className="visually-hidden">{status.srText}</span>
            </span>
            <span className="text-secondary small fw-medium">{status.label}</span>
          </div>
        </div>

        <div className="collapse navbar-collapse" id="navbar-menu">
          <ul className="navbar-nav">
            <li className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
              <button
                type="button"
                className="nav-link btn btn-link"
                onClick={() => onSelectTab('overview')}
                aria-current={activeTab === 'overview' ? 'page' : undefined}
              >
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconChartLine size={18} />
                </span>
                <span className="nav-link-title">Tổng quan</span>
              </button>
            </li>

            <li className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}>
              <button
                type="button"
                className="nav-link btn btn-link"
                onClick={() => onSelectTab('incidents')}
                aria-current={activeTab === 'incidents' ? 'page' : undefined}
              >
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconAlertTriangle size={18} />
                </span>
                <span className="nav-link-title">Sự cố</span>
                {openIncidentsCount > 0 && (
                  <span className="badge bg-red ms-2">{openIncidentsCount}</span>
                )}
              </button>
            </li>

            <li className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}>
              <button
                type="button"
                className="nav-link btn btn-link"
                onClick={() => onSelectTab('logs')}
                aria-current={activeTab === 'logs' ? 'page' : undefined}
              >
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconDatabase size={18} />
                </span>
                <span className="nav-link-title">Nhật ký</span>
              </button>
            </li>

            <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <button
                type="button"
                className="nav-link btn btn-link"
                onClick={() => onSelectTab('settings')}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
              >
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconSettings size={18} />
                </span>
                <span className="nav-link-title">Cấu hình</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
