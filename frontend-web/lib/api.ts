const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    return null;
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },

  vehiculos: {
    listar: () => request('/api/vehiculos'),
    crear: (data: object) => request('/api/vehiculos', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: (id: number, data: object) => request(`/api/vehiculos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  conductores: {
    listar: () => request('/api/conductores'),
    crear: (data: object) => request('/api/conductores', { method: 'POST', body: JSON.stringify(data) }),
  },

  rutas: {
    listar: (estado?: string) => request(`/api/rutas${estado ? `?estado=${estado}` : ''}`),
    iniciar: (data: object) => request('/api/rutas', { method: 'POST', body: JSON.stringify(data) }),
    cerrar: (id: number) => request(`/api/rutas/${id}/cerrar`, { method: 'PATCH' }),
  },

  pedidos: {
    listar: () => request('/api/pedidos'),
    crear: (data: object) => request('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }),
    asignar: (id: number, ruta_id: number) =>
      request(`/api/pedidos/${id}/asignar`, { method: 'PATCH', body: JSON.stringify({ ruta_id }) }),
    actualizar: (id: number, data: object) =>
      request(`/api/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
