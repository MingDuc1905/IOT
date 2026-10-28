import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

export function useIncidents(filters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterStatus = filters.status;
  const filterNode = filters.node_id;

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterNode) params.node_id = filterNode;

      const data = await api.getIncidents(params);
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterNode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateIncident = async (ticketId, updates) => {
    // Cập nhật lạc quan (Optimistic update)
    const prevList = [...incidents];
    setIncidents((prev) =>
      prev.map((item) => (item.ticket_id === ticketId ? { ...item, ...updates } : item))
    );

    try {
      const saved = await api.updateIncident(ticketId, updates);
      setIncidents((prev) =>
        prev.map((item) => (item.ticket_id === ticketId ? saved : item))
      );
      return saved;
    } catch (err) {
      // Revert lại nếu có lỗi
      setIncidents(prevList);
      throw err;
    }
  };

  const openIncidentsCount = incidents.filter((t) => t.status !== 'RESOLVED').length;

  return {
    incidents,
    loading,
    error,
    refresh,
    updateIncident,
    openIncidentsCount,
  };
}
