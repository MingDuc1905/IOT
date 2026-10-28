async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error: ${res.status}`;
    try {
      const json = await res.json();
      if (json?.error?.message) {
        errorMsg = json.error.message;
      }
    } catch {
      // ignore JSON parse error on non-json error responses
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getLive: (nodeId = 'NODE-01') => request(`/api/live?node_id=${encodeURIComponent(nodeId)}`),
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/incidents${query ? `?${query}` : ''}`);
  },
  updateIncident: (ticketId, data) =>
    request(`/api/incidents/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/logs${query ? `?${query}` : ''}`);
  },
  deleteLogs: (nodeId) =>
    request(`/api/logs${nodeId ? `?node_id=${encodeURIComponent(nodeId)}` : ''}`, {
      method: 'DELETE',
    }),
  getSettings: () => request('/api/settings'),
  updateSettings: (data) =>
    request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getNodes: () => request('/api/nodes'),
  getHealth: () => request('/api/health'),
  getSim: () => request('/api/sim'),
  startSim: (scenario) =>
    request('/api/sim', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
  stopSim: () =>
    request('/api/sim/stop', {
      method: 'POST',
    }),
};
