import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';

export function useLiveStream(nodeId = 'NODE-01') {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [latestIncident, setLatestIncident] = useState(null);

  const eventSourceRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryDelayRef = useRef(1000);

  // 1. Fetch snapshot ban đầu qua REST API
  useEffect(() => {
    let isMounted = true;
    api
      .getLive(nodeId)
      .then((data) => {
        if (!isMounted) return;
        if (data.current) setCurrent(data.current);
        if (Array.isArray(data.history)) setHistory(data.history);
        setConnected(Boolean(data.connected));
        if (data.sim?.active) setSimActive(true);
      })
      .catch((err) => {
        console.warn('[LIVE] Chưa lấy được snapshot ban đầu:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [nodeId]);

  // 2. Mở kết nối SSE với cơ chế tự động kết nối lại (Exponential Backoff)
  useEffect(() => {
    let isMounted = true;

    function connectSSE() {
      if (!isMounted) return;

      const es = new EventSource('/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setStreamConnected(true);
        retryDelayRef.current = 1000; // Reset độ trễ khi kết nối thành công
      };

      es.addEventListener('init', (e) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          setConnected(Boolean(payload.connected));
          setSimActive(Boolean(payload.sim?.active));
          if (payload.lastSample) setCurrent(payload.lastSample);
        } catch (err) {
          console.error('[SSE init error]', err);
        }
      });

      es.addEventListener('sample', (e) => {
        if (!isMounted) return;
        try {
          const sample = JSON.parse(e.data);
          setCurrent(sample);
          setConnected(Boolean(sample.esp_connected));
          setSimActive(Boolean(sample.sim_active));

          setHistory((prev) => {
            const next = [...prev, sample];
            return next.length > 120 ? next.slice(next.length - 120) : next;
          });
        } catch (err) {
          console.error('[SSE sample error]', err);
        }
      });

      es.addEventListener('incident', (e) => {
        if (!isMounted) return;
        try {
          const incident = JSON.parse(e.data);
          setLatestIncident(incident);
        } catch (err) {
          console.error('[SSE incident error]', err);
        }
      });

      es.addEventListener('status', (e) => {
        if (!isMounted) return;
        try {
          const status = JSON.parse(e.data);
          setConnected(Boolean(status.esp_connected));
          setSimActive(Boolean(status.sim_active));
        } catch (err) {
          console.error('[SSE status error]', err);
        }
      });

      es.onerror = () => {
        if (!isMounted) return;
        setStreamConnected(false);
        es.close();

        // Tăng thời gian chờ (1s -> 2s -> tối đa 5s)
        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(5000, delay * 2);
        retryTimeoutRef.current = setTimeout(connectSSE, delay);
      };
    }

    connectSSE();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    current,
    history,
    connected,
    simActive,
    streamConnected,
    latestIncident,
  };
}
