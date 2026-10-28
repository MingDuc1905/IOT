import { useState, useEffect } from 'react';
import { Navbar } from './layout/Navbar.jsx';
import { PageHeader } from './layout/PageHeader.jsx';
import { Footer } from './layout/Footer.jsx';
import { OverviewPage } from './features/overview/OverviewPage.jsx';
import { IncidentsPage } from './features/incidents/IncidentsPage.jsx';
import { LogsPage } from './features/logs/LogsPage.jsx';
import { SettingsPage } from './features/settings/SettingsPage.jsx';
import { useLiveStream } from './hooks/useLiveStream.js';
import { useIncidents } from './hooks/useIncidents.js';
import { useLogs } from './hooks/useLogs.js';
import { api } from './api/client.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(null);

  // Dữ liệu thời gian thực qua Server-Sent Events (SSE)
  const { current, history, connected, simActive, latestIncident } = useLiveStream('NODE-01');

  // Quản lý phiếu sự cố
  const {
    incidents,
    updateIncident,
    refresh: refreshIncidents,
    openIncidentsCount,
  } = useIncidents();

  // Quản lý nhật ký phân trang
  const {
    logs,
    total,
    page,
    limit,
    totalPages,
    loading: logsLoading,
    setPage,
    refresh: refreshLogs,
    deleteLogs,
  } = useLogs(100);

  // Tải cấu hình hệ thống
  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.warn('[APP] Chưa tải được settings:', err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdateSettings = async (newForm) => {
    const res = await api.updateSettings(newForm);
    setSettings(res.settings);
  };

  const TAB_HEADERS = {
    overview: {
      title: 'Bảng Điều Khiển Giám Sát Áp Suất',
      description: 'Giám sát áp lực đường ống thời gian thực và phân loại trạng thái cận biên',
    },
    incidents: {
      title: 'Quản Lý Phiếu Sự Cố',
      description: 'Theo dõi tiến trình xử lý, phân công và nhật ký giải quyết bục vỡ đường ống',
    },
    logs: {
      title: 'Nhật Ký Dữ Liệu Đo Đạc',
      description: 'Lịch sử tín hiệu ADC, điện áp và đối chiếu thuật toán Edge vs Server',
    },
    settings: {
      title: 'Cấu Hình Hệ Thống & Kịch Bản Mô Phỏng',
      description: 'Thiết lập ngưỡng vận hành, tham số lọc số và kịch bản thuyết minh thực nghiệm',
    },
  };

  const header = TAB_HEADERS[activeTab] || TAB_HEADERS.overview;

  return (
    <div className="page">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        connected={connected}
        simActive={simActive}
        openIncidentsCount={openIncidentsCount}
      />

      <div className="page-wrapper">
        <main id="content" className="d-flex flex-column flex-fill">
          <PageHeader title={header.title} description={header.description} />

          <div className="page-body">
            <div className="container-xl">
              {activeTab === 'overview' && (
                <OverviewPage
                  current={current}
                  history={history}
                  openIncidentsCount={openIncidentsCount}
                  settings={settings}
                  latestIncident={latestIncident}
                  onNavigateToIncidents={() => setActiveTab('incidents')}
                  onStartSim={() => api.startSim('normal')}
                />
              )}

              {activeTab === 'incidents' && (
                <IncidentsPage
                  incidents={incidents}
                  onUpdateIncident={updateIncident}
                  onRefresh={refreshIncidents}
                />
              )}

              {activeTab === 'logs' && (
                <LogsPage
                  logs={logs}
                  total={total}
                  page={page}
                  limit={limit}
                  totalPages={totalPages}
                  loading={logsLoading}
                  onSetPage={setPage}
                  onRefresh={refreshLogs}
                  onDeleteLogs={deleteLogs}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  simActive={simActive}
                  currentScenario={current?.status || 'idle'}
                />
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
