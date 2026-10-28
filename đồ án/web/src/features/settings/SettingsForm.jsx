import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { IconSettings, IconCheck, IconWifi } from '@tabler/icons-react';

export function SettingsForm({ settings, onUpdateSettings }) {
  const [form, setForm] = useState({
    esp_url: 'http://192.168.4.1',
    poll_ms: 500,
    p_min: 0.05,
    p_max: 0.35,
    drop_thresh: -0.08,
    drop_streak: 2,
    ema_alpha: 0.25,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        esp_url: settings.esp_url || 'http://192.168.4.1',
        poll_ms: settings.poll_ms || 500,
        p_min: settings.p_min ?? 0.05,
        p_max: settings.p_max ?? 0.35,
        drop_thresh: settings.drop_thresh ?? -0.08,
        drop_streak: settings.drop_streak ?? 2,
        ema_alpha: settings.ema_alpha ?? 0.25,
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Lỗi lưu cấu hình: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const start = Date.now();
      const health = await api.getHealth();
      const latency = Date.now() - start;
      setTestResult({
        ok: health.esp_connected,
        latency,
        message: health.esp_connected
          ? `ESP8266 trực tuyến (Độ trễ: ${latency}ms)`
          : 'Không thể kết nối tới ESP8266 qua mạng Wi-Fi.',
      });
    } catch (err) {
      setTestResult({ ok: false, message: `Lỗi: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Cấu hình kết nối &amp; Ngưỡng vận hành</h2>
          <p className="card-subtitle">Điều chỉnh tham số cảm biến MPS20N0040D và thông số lọc số</p>
        </div>
      </div>

      <div className="card-body">
        {saveSuccess && (
          <div className="alert alert-success d-flex align-items-center py-2 mb-3">
            <IconCheck size={20} className="me-2" /> Đã lưu và áp dụng cấu hình mới thành công!
          </div>
        )}

        <div className="mb-3">
          <label className="form-label" htmlFor="cfg-esp-url">Địa chỉ Web Server ESP8266</label>
          <div className="input-group">
            <input id="cfg-esp-url" type="text" className="form-control font-monospace"
              value={form.esp_url} onChange={(e) => setForm({ ...form, esp_url: e.target.value })}
              placeholder="http://192.168.4.1" required />
            <button type="button" className="btn btn-outline-secondary" onClick={handleTestConnection} disabled={testing}>
              <IconWifi size={16} className="me-1" /> {testing ? 'Đang thử...' : 'Kiểm tra'}
            </button>
          </div>
          {testResult && (
            <div className={`small mt-1 ${testResult.ok ? 'text-success' : 'text-danger'}`}>{testResult.message}</div>
          )}
        </div>

        <div className="row g-3">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-p-min">Ngưỡng áp suất thấp (P_min) - Bar</label>
            <input id="cfg-p-min" type="number" step="0.01" min="0.00" max="0.40" className="form-control font-monospace"
              value={form.p_min} onChange={(e) => setForm({ ...form, p_min: parseFloat(e.target.value) })} required />
            <small className="form-hint">Cảnh báo rò rỉ hoặc mất nguồn cấp.</small>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-p-max">Ngưỡng áp suất cao (P_max) - Bar</label>
            <input id="cfg-p-max" type="number" step="0.01" min="0.00" max="0.40" className="form-control font-monospace"
              value={form.p_max} onChange={(e) => setForm({ ...form, p_max: parseFloat(e.target.value) })} required />
            <small className="form-hint">Cảnh báo quá áp búa nước.</small>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-drop-thresh">Ngưỡng dP/dt tụt dốc - Bar/s</label>
            <input id="cfg-drop-thresh" type="number" step="0.01" max="0.00" className="form-control font-monospace"
              value={form.drop_thresh} onChange={(e) => setForm({ ...form, drop_thresh: parseFloat(e.target.value) })} required />
            <small className="form-hint">Tốc độ sụt giảm kích hoạt vỡ ống.</small>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-drop-streak">Số chu kỳ tụt dốc liên tục</label>
            <input id="cfg-drop-streak" type="number" min="1" max="10" className="form-control font-monospace"
              value={form.drop_streak} onChange={(e) => setForm({ ...form, drop_streak: parseInt(e.target.value, 10) })} required />
            <small className="form-hint">Chống báo động giả khi mở vòi nước.</small>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-ema">Hệ số lọc số EMA (&alpha;)</label>
            <input id="cfg-ema" type="number" step="0.05" min="0.05" max="1.00" className="form-control font-monospace"
              value={form.ema_alpha} onChange={(e) => setForm({ ...form, ema_alpha: parseFloat(e.target.value) })} required />
            <small className="form-hint">Càng nhỏ tín hiệu càng mượt.</small>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="cfg-poll-ms">Chu kỳ đọc dữ liệu (ms)</label>
            <input id="cfg-poll-ms" type="number" step="100" min="100" max="5000" className="form-control font-monospace"
              value={form.poll_ms} onChange={(e) => setForm({ ...form, poll_ms: parseInt(e.target.value, 10) })} required />
            <small className="form-hint">Mặc định: 500ms.</small>
          </div>
        </div>
      </div>

      <div className="card-footer text-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <IconSettings size={16} className="me-1" />
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>
    </form>
  );
}
