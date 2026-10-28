import { useState, useEffect } from 'react';

export function IncidentModal({ open, incident, onClose, onSave }) {
  const [status, setStatus] = useState('PENDING');
  const [staffName, setStaffName] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (incident) {
      setStatus(incident.status || 'PENDING');
      setStaffName(incident.staff_name || '');
      setActionTaken(incident.action_taken || '');
      setErrorMsg('');
    }
  }, [incident]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !incident) return null;

  const isResolved = status === 'RESOLVED';
  const actionInvalid = isResolved && (!actionTaken || !actionTaken.trim());
  const isDirty =
    status !== incident.status ||
    staffName !== (incident.staff_name || '') ||
    actionTaken !== (incident.action_taken || '');

  const handleSave = async () => {
    if (actionInvalid) {
      setErrorMsg('Phải ghi rõ biện pháp khắc phục trước khi giải quyết đóng phiếu.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      await onSave(incident.ticket_id, {
        status,
        staff_name: staffName,
        action_taken: actionTaken,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="modal modal-blur fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-ticket-title"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" id="modal-ticket-title">
                Cập nhật phiếu sự cố: <span className="font-monospace text-primary">{incident.ticket_id}</span>
              </h2>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Đóng"
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="f-status">
                  Trạng thái xử lý
                </label>
                <select
                  id="f-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PENDING">Chờ tiếp nhận</option>
                  <option value="INVESTIGATING">Đang kiểm tra</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="f-staff">
                  Nhân viên tiếp nhận
                </label>
                <input
                  id="f-staff"
                  type="text"
                  className="form-control"
                  placeholder="Họ tên kỹ thuật viên xử lý..."
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="f-action">
                  Nguyên nhân &amp; biện pháp khắc phục
                </label>
                <textarea
                  id="f-action"
                  rows={3}
                  className={`form-control ${actionInvalid ? 'is-invalid' : ''}`}
                  placeholder="Ghi nhận hiện trường và giải pháp sửa chữa..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                />
                {actionInvalid && (
                  <div className="invalid-feedback">
                    Phải ghi biện pháp khắc phục trước khi đóng phiếu.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn me-auto"
                onClick={onClose}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isDirty || actionInvalid || saving}
                onClick={handleSave}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}
