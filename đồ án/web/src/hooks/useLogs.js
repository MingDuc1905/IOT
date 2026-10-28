import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

export function useLogs(initialLimit = 100) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * limit;
      const res = await api.getLogs({
        limit,
        offset,
        ...filters,
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const deleteLogs = async (nodeId) => {
    await api.deleteLogs(nodeId);
    setPage(1);
    await fetchLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    logs,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    setPage,
    setLimit,
    setFilters,
    refresh: fetchLogs,
    deleteLogs,
  };
}
