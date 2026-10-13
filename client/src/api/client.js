const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  Object.assign(headers, options.headers || {});

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Pyyntö epäonnistui');
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Rides
  getRides: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.append(k, v); });
    return request(`/rides?${q}`);
  },
  createRide: (data) => request('/rides', { method: 'POST', body: JSON.stringify(data) }),
  updateRide: (id, data) => request(`/rides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRide: (id) => request(`/rides/${id}`, { method: 'DELETE' }),
  getBikes: () => request('/rides/bikes'),

  // Stats
  getStatsSummary: (year) => request(`/stats/summary?year=${year}`),
  getHeatmap: (year) => request(`/stats/heatmap?year=${year}`),
  getMonthlyStats: (year) => request(`/stats/monthly?year=${year}`),
  getRecords: () => request('/stats/records'),

  // Goal
  getGoal: (year) => request(`/goal?year=${year}`),
  updateGoal: (year, goalKm) =>
    request('/goal', { method: 'PUT', body: JSON.stringify({ year, goalKm }) }),

  // Export
  exportCsv: async () => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    }
    if (!res.ok) throw new Error('Vienti epäonnistui');

    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    return { blob: await res.blob(), filename: match ? match[1] : 'pyorailyt.csv' };
  },

  // Import
  importCsv: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/import/csv', { method: 'POST', body: form });
  },
};
