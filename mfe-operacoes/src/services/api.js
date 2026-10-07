const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao processar requisição no servidor.');
    }
    return data;
  } catch (error) {
    console.error(`Erro na API [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Encomendas
  getDeliveries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/deliveries${qs ? '?' + qs : ''}`);
  },
  createDelivery: (data) => request('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  pickupDelivery: (id, data) => request(`/deliveries/${id}/pickup`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Portaria / Acesso
  getAccessLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/access${qs ? '?' + qs : ''}`);
  },
  registerEntry: (data) => request('/access/entry', { method: 'POST', body: JSON.stringify(data) }),
  registerExit: (id) => request(`/access/${id}/exit`, { method: 'PATCH' }),

  // Unidades & Moradores
  getUnits: () => request('/units'),
  getResidents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/residents${qs ? '?' + qs : ''}`);
  },
  createResident: (data) => request('/residents', { method: 'POST', body: JSON.stringify(data) }),
  deleteResident: (id) => request(`/residents/${id}`, { method: 'DELETE' }),
  getVehicles: () => request('/vehicles'),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  getPets: () => request('/pets'),

  // Reservas
  getSpaces: () => request('/spaces'),
  getReservations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reservations${qs ? '?' + qs : ''}`);
  },
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'PATCH' }),

  // Financeiro
  getFinancialSummary: () => request('/financial/summary'),
  getFinancialTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/financial/transactions${qs ? '?' + qs : ''}`);
  },
  createFinancialTransaction: (data) => request('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
  payFinancialTransaction: (id) => request(`/financial/transactions/${id}/pay`, { method: 'PATCH' }),

  // Comunicados
  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/announcements${qs ? '?' + qs : ''}`);
  },
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Mercadinho
  getMarketProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/market/products${qs ? '?' + qs : ''}`);
  },
  createMarketProduct: (data) => request('/market/products', { method: 'POST', body: JSON.stringify(data) }),
  updateMarketStock: (id, data) => request(`/market/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(data) }),
  checkoutMarket: (data) => request('/market/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getMarketSales: () => request('/market/sales'),
};
